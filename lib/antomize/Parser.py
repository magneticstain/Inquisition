#!/usr/bin/python3

"""

APP: Inquisition
DESC: 
CREATION_DATE: 2017-04-08

"""

# MODULES
# | Native

# | Third-Party

# | Custom
from lib.antomize.Template import Template

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development|Staging|Production'


class Parser:
    dbHandle = None
    parserID = 0
    parserName = ''
    logFile = ''
    templateStore = {}

    def __init__(self, dbHandle, parserID=0, parserName='Syslog', logFile='/var/log/syslog'):
        self.dbHandle = dbHandle
        self.parserID = parserID
        self.parserName = parserName
        self.logFile = logFile

        # load templates for template store
        # TODO
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
