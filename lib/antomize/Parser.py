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
from lib.antomize.Template import Template

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
    dbHandle = None
    parserID = 0
    parserName = ''
    logFile = ''
    templateStore = {}

    def __init__(self, lgr, dbHandle, parserID=0, parserName='Syslog', logFile='/var/log/syslog'):
        self.lgr = lgr
        self.dbHandle = dbHandle
        self.parserID = parserID
        self.parserName = parserName
        self.logFile = logFile

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
                    PTFTM.parser_id = 1
                AND 
                    FT.status = 1
                ORDER BY TID
            '''

        # execute query
        with self.dbHandle.cursor() as dbCursor:
            dbCursor.execute(sql)

            # fetch results
            dbResults = dbCursor.fetchall()
            for row in dbResults:
                # add each template to template store
                templates[row['TID']] = Template(row['TID'], row['field_name'], row['regex'], row['template_name'])

        return templates

    def processLog(self, rawLog):
        """
        Run log through templates in template store in order to generate a new logical log
        
        :param rawLog: a raw log to be processed, coming in in the form of a string
        :return: bool
        """

        self.lgr.debug('processing log [[[ ' + rawLog + ' ]]] using parser [ ' + str(self.parserID) + ' - ' +
                       self.parserName + ' ]')

        # remove prepended and trailing newlines/whitespace/etc
        rawLog.strip(" \r\n\t")

        self.lgr.debug('POST-PROCESSED LOG [[[ ' + rawLog + ' ]]] using parser [ ' + str(self.parserID) + ' - ' +
                       self.parserName + ' ]')

        return True

    def pollLogFile(self, isTestRun=False):
        """
        Tails the log file for one log and processes it
        
        :param isTestRun: signifies if we're performing a test run or not
        :return: void
        """

        # initialize log file
        offsetFile = '/opt/inquisition/tmp/' + str(self.parserID) + '_' + self.parserName + '.offset'

        # fetch log
        try:
            for log in Pygtail(self.logFile, offset_file=offsetFile, paranoid=True):
                # try to process the log
                if not self.processLog(log):
                    # log processing failed :(
                    self.lgr.warning('could not process log :: [ ' + str(self.parserID) + ' - '
                                     + self.parserName + ' ] :: [ ' + log + ' ]')

                    # exit w/ error if we're running a test run
                    if isTestRun:
                        self.lgr.debug('configured as a test run, we should exit')
                        exit(1)
                else:
                    # log parsed successfully :)
                    self.lgr.debug('log successfully processed :: [ ' + str(self.parserID) + ' - ' + self.parserName
                                   + ' ]')
                    # break after parsing one log if running a test run
                    if isTestRun:
                        self.lgr.debug('configured as a test run, breaking out of loop')
                        break
        except FileNotFoundError as e:
            self.lgr.error('could not open file for parser :: [ PARSER: ' + str(self.parserID) + ' - '
                           + self.parserName + ' ] :: [ READING FROM LOG FILE: ' + self.logFile
                           + ' ] :: [ OFFSET FILE: ' + offsetFile + ' ] :: [ MSG: ' + str(e) + ' ]')
        except PermissionError as e:
            self.lgr.error('permission denied when trying to access target log file :: [ PARSER: ' + str(self.parserID)
                           + ' - ' + self.parserName + ' ] :: [ READING FROM LOG FILE: ' + self.logFile
                           + ' ] :: [ OFFSET FILE: ' + offsetFile + ' ] :: [ MSG: ' + str(e) + ' ]')
        except UnicodeDecodeError as e:
            self.lgr.error('content with invalid formatting found in target log file :: [ PARSER: ' + str(self.parserID)
                           + ' - ' + self.parserName + ' ] :: [ READING FROM LOG FILE: ' + self.logFile
                           + ' ] :: [ OFFSET FILE: ' + offsetFile + ' ] :: [ MSG: ' + str(e) + ' ]')

