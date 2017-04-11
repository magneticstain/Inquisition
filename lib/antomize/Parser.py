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

        # load templates for template store
        self.templateStore = self.fetchTemplates()

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

        # remove trailing newlines/whitespace/etc
        rawLog.strip(' \t\n\r')

        print(rawLog)

        return True

    def pollLogFile(self):
        """
        Tails the log file for one log and processes it
        
        :return: void
        """

        # initialize log file
        offsetFile = '/opt/inquisition/tmp/' + str(self.parserID) + '_' + self.parserName + '.offset'

        # fetch log
        try:
            for log in Pygtail(self.logFile, offset_file=offsetFile, paranoid=True):
                if not self.processLog(log):
                    # log processing failed :(
                    self.lgr.warning('could not process log :: [ ' + str(self.parserID) + ' - '
                                     + self.parserName + ' ] :: [ ' + log + ' ]')
        except FileNotFoundError as e:
            self.lgr.error('could not initialize offset file for parser :: [ ' + str(self.parserID) + ' - '
                           + self.parserName + ' ] :: [ ' + offsetFile + ' ]')

