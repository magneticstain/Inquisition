#!/usr/bin/python3

"""
Parser.py

APP: Inquisition
DESC: The log-parsing portion of the Inquisition suite; responsible for parsing incoming logs based on templates
CREATION_DATE: 2017-04-08

"""

# MODULES
# | Native

# | Third-Party
from pygtail import Pygtail

# | Custom
from lib.anatomize.Template import Template

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class Parser:
    lgr = None
    # logDbConnInfo = {}
    inquisitionDbHandle = None
    logDbHandle = None
    parserID = 0
    parserName = ''
    logFile = ''
    templateStore = {}

    def __init__(self, lgr, inquisitionDbHandle, logDbHandle, parserID=0, parserName='Syslog',
                 logFile='/var/log/syslog'):
        self.lgr = lgr
        self.inquisitionDbHandle = inquisitionDbHandle
        self.logDbHandle = logDbHandle
        # self.logDbConnInfo = logDbConnInfo
        self.parserID = parserID
        self.parserName = parserName
        self.logFile = logFile

        # create log db connection
        # self.logDbHandle = redis.StrictRedis(host=self.logDbConnInfo['host'], port=self.logDbConnInfo['port'])

        self.lgr.debug('parser [ ' + self.parserName + ' ] with ID [ ' + str(self.parserID) + ' ] created successfully')

        # load templates for template store
        self.templateStore = self.fetchTemplates()
        self.lgr.debug('loaded [ ' + str(len(self.templateStore)) + ' ] templates for parser [ ' + str(self.parserID) +
                       ' - ' + self.parserName + ' ]')

    def fetchTemplates(self):
        """
        Fetch field templates from database

        :return: dict
        """

        templates = {}

        # fetch templates from DB for relevant parser ID
        sql = '''
                SELECT 
                    FT.template_id as TID, 
                    template_name, 
                    field_name, 
                    regex 
                FROM 
                    FieldTemplates FT
                JOIN 
                    ParserToFieldTemplateMapping PTFTM 
                USING 
                    (template_id) 
                JOIN 
                    Fields F 
                ON 
                    (FT.field_id=F.field_id)
                JOIN 
                    FieldTemplateRegex FTR 
                ON 
                    (FT.regex_id=FTR.regex_id) 
                WHERE 
                    PTFTM.parser_id = %d
                AND 
                    FT.status = 1
                ORDER BY TID
            '''

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql % (int(self.parserID)))

            # fetch results
            dbResults = dbCursor.fetchall()
            for row in dbResults:
                # add each template to template store
                templates[row['TID']] = Template(row['TID'], row['field_name'], row['regex'], row['template_name'])

                self.lgr.debug('loaded template SUCCESSFULLY :: [ TID: ' + str(row['TID']) + ' // NAME: '
                               + row['template_name'] + ' // FIELD: ' + row['field_name'] + ' // REGEX: {{ '
                               + row['regex'] + ' }} ]')

        return templates

    def parseLog(self, rawLog):
        """
        Parse log into individual fields and stick them in a database
        
        :param rawLog: a raw log to be processed, coming in in the form of a string
        :return: bool
        """

        logData = {}

        # get current log ID
        logId = int(self.logDbHandle.get('log_id').decode('utf-8'))
        if not logId and logId != 0:
            # could not fetch log ID
            errMsg = 'could not fetch ID for new log'
            self.lgr.critical(errMsg)
            raise RuntimeError(errMsg)
        if logId < 0:
            raise ValueError('invalid log ID provided when trying to parse new log')

        # craft db key
        dbKey = str(self.parserID) + '_' + self.parserName + ':' + str(logId)

        # try to match log against each template in template store
        for templateId in self.templateStore:
            matchedString = self.templateStore[templateId].matchLogAgainstRegex(rawLog)
            if matchedString:
                # add matched field and value to log data dict
                logData[self.templateStore[templateId].field] = matchedString
                self.lgr.debug('template MATCHED log :: [ TID: ' + str(templateId) + ' - '
                               + self.templateStore[templateId].templateName + ' ] :: [ FIELD: '
                               + self.templateStore[templateId].field + ' ] :: [ REGEX: {{ '
                               + self.templateStore[templateId].rawRegex + ' }} ]')
            else:
                # didn't match template
                self.lgr.debug('template DID NOT MATCH log :: [ TID: ' + str(templateId) + ' - '
                               + self.templateStore[templateId].templateName + ' ] :: [ FIELD: '
                               + self.templateStore[templateId].field + ' ] :: [ REGEX: {{ '
                               + self.templateStore[templateId].rawRegex + ' }} ]')

        # check if we matched anything
        if not logData:
            # we parsed everything, but nothing matched; go ahead and exit w/ success
            return True

        # insert log into db
        if self.logDbHandle.hmset(dbKey, logData):
            # increase log ID
            if self.logDbHandle.incr('log_id'):
                return True

        return False

    def processLog(self, rawLog):
        """
        Filter and process raw log
        
        :param rawLog: a raw log to be processed, coming in in the form of a string
        :return: bool
        """

        self.lgr.debug('processing log [[[ ' + rawLog + ' ]]] using parser [ ' + str(self.parserID) + ' - ' +
                       self.parserName + ' ]')

        # remove prepended and trailing newlines/whitespace/etc
        rawLog.strip(" \r\n\t")

        self.lgr.debug('POST-PROCESSED LOG [[[ ' + rawLog + ' ]]] using parser [ ' + str(self.parserID) + ' - ' +
                       self.parserName + ' ]')

        # parse post-processed log
        if not self.parseLog(rawLog):
            return False

        return True

    def pollLogFile(self, isTestRun=False):
        """
        Tails the log file for one log and processes it
        
        :param isTestRun: signifies if we're performing a test run or not
        :return: void
        """

        # initialize offset file
        offsetFile = '/opt/inquisition/tmp/' + str(self.parserID) + '_' + self.parserName + '.offset'

        # generate parser info string for logging
        parserInfo = '[ PARSER: ' + str(self.parserID) + ' - ' + self.parserName + ' ] :: [ READING FROM LOG FILE: ' \
                     + self.logFile + ' ] :: [ OFFSET FILE: ' + offsetFile + ' ]'

        # fetch new log(s)
        try:
            # NOTE: paranoid denotes updating the offset file after every log is read; statefullness is important ^_^
            for log in Pygtail(self.logFile, offset_file=offsetFile, paranoid=True):
                # try to process the log
                if self.processLog(log):
                    # log parsed successfully :)
                    self.lgr.debug('log successfully processed :: [ ParserID: ' + str(self.parserID) + ' - ' + self.parserName
                                   + ' ]')

                    # break after parsing a single log if running a test run
                    if isTestRun:
                        self.lgr.debug('configured as a test run, ceasing parsing')
                        break
                else:
                    # log processing failed :(
                    self.lgr.warning('could not process log :: [ ParserID: ' + str(self.parserID) + ' - '
                                     + self.parserName + ' ] :: [ ' + log + ' ]')

                    # exit w/ error if we're running a test run
                    if isTestRun:
                        self.lgr.debug('configured as a test run, we should exit')
                        exit(1)
        except FileNotFoundError as e:
            self.lgr.error('could not open file for parser :: ' + parserInfo + ' :: [ MSG: ' + str(e) + ' ]')
        except PermissionError as e:
            self.lgr.error('permission denied when trying to access target log file :: ' + parserInfo + ' :: [ MSG: '
                           + str(e) + ' ]')
        except UnicodeDecodeError as e:
            self.lgr.error('content with invalid formatting found in target log file :: ' + parserInfo + ' :: [ MSG: '
                           + str(e) + ' ]')

