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
    inquisitionDbHandle = None
    logDbHandle = None
    parserID = 0
    parserName = ''
    logFile = ''
    offsetFile = ''
    templateStore = {}

    def __init__(self, lgr, inquisitionDbHandle, logDbHandle, parserID=0, parserName='Syslog',
                 logFile='/var/log/syslog'):
        self.lgr = lgr
        self.inquisitionDbHandle = inquisitionDbHandle
        self.logDbHandle = logDbHandle
        self.parserID = parserID
        self.parserName = parserName
        self.logFile = logFile

        self.lgr.debug(self.__str__() + ' created SUCCESSFULLY')

        # load templates for template store
        self.templateStore = self.fetchTemplates()
        self.lgr.debug('loaded [ ' + str(len(self.templateStore)) + ' ] templates for ' + self.__str__())

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

                self.lgr.debug('loaded template SUCCESSFULLY :: ' + str(templates[row['TID']]))

        return templates

    def parseLog(self, rawLog):
        """
        Parse log into individual fields and stick them in a database
        
        :param rawLog: a raw log to be processed, coming in in the form of a string
        :return: bool
        """

        logData = {}

        # get current log ID
        logId = self.logDbHandle.get('log_id')
        if not logId:
            # could not fetch log ID
            errMsg = 'could not fetch ID for new log'
            self.lgr.critical(errMsg)
            raise RuntimeError(errMsg)

        # normalize logId
        logId = int(logId.decode('utf-8'))
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
                self.lgr.debug('template MATCHED log :: ' + str(self.templateStore[templateId]))
            else:
                # didn't match template
                self.lgr.debug('template DID NOT MATCH log :: ' + str(self.templateStore[templateId]))

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

        self.lgr.debug('processing log [[[ ' + rawLog + ' ]]] using ' + self.__str__())

        # remove prepended and trailing newlines/whitespace/etc
        rawLog.strip(" \r\n\t")

        self.lgr.debug('POST-PROCESSED LOG [[[ ' + rawLog + ' ]]] using ' + self.__str__())

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
        self.offsetFile = '/opt/inquisition/tmp/' + str(self.parserID) + '_' + self.parserName + '.offset'

        # fetch new log(s)
        try:
            # NOTE: paranoid denotes updating the offset file after every log is read; statefullness is important ^_^
            for log in Pygtail(self.logFile, offset_file=self.offsetFile, paranoid=True):
                # try to process the log
                if self.processLog(log):
                    # log parsed successfully :)
                    self.lgr.debug('log successfully processed :: ' + self.__str__())

                    # break after parsing a single log if running a test run
                    if isTestRun:
                        self.lgr.debug('configured as a test run, ceasing parsing')
                        break
                else:
                    # log processing failed :(
                    self.lgr.warning('could not process log :: '  + self.__str__() + ' :: [ ' + log + ' ]')

                    # exit w/ error if we're running a test run
                    if isTestRun:
                        self.lgr.debug('configured as a test run, we should exit')
                        exit(1)
        except FileNotFoundError as e:
            self.lgr.error('could not open file for parser :: ' + self.__str__() + ' :: [ MSG: ' + str(e) + ' ]')
        except PermissionError as e:
            self.lgr.error('permission denied when trying to access target log file :: ' + self.__str__() + ' :: [ MSG: '
                           + str(e) + ' ]')
        except UnicodeDecodeError as e:
            self.lgr.error('content with invalid formatting found in target log file :: ' + self.__str__() + ' :: [ MSG: '
                           + str(e) + ' ]')

    def __str__(self):
        """
        Print metadata as a string
        
        :return: str
        """

        return '[ PARSER ID: ' + str(self.parserID) + ' // NAME: ' + self.parserName + ' // READING FROM LOG FILE: ' \
               + self.logFile + ' // OFFSET FILE: ' + self.offsetFile + ' ]'

