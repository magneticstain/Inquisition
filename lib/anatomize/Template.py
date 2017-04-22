#!/usr/bin/python3

"""
Template.py

APP: Inquisition
DESC: Logical representation of a template for any given log field
CREATION_DATE: 2017-04-08

"""

# MODULES
# | Native
import re

# | Third-Party

# | Custom

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class Template:
    templateID = 0
    templateName = ''
    field = ''
    rawRegex = ''
    compiledRegex = None

    def __init__(self, templateID, field, regex, templateName='Default'):
        self.templateID = templateID
        self.templateName = templateName
        self.field = field

        self.setRegex(regex)

    def setRegex(self, regex):
        """
        Sets raw and compiled regex from provided regex pattern
        
        :param regex: raw regex pattern
        :return: void
        """

        # set raw regex
        self.rawRegex = regex

        # compile raw regex
        self.compiledRegex = re.compile(regex)

    def matchLogAgainstRegex(self, log):
        """
        Matches given log against set regex and returns the value
        
        :param log: raw log message
        :return: parsed string
        """

        matchedString = ''

        if not log:
            # no log provided
            raise ValueError('no log provided')

        # try regex matching
        regexMatch = self.compiledRegex.search(log)
        if regexMatch:
            # match found, return result
            matchedString = regexMatch.group()

        return matchedString

    def __str__(self):
        """
        Override __str__special method to print template metadata when obj is treated as a string
        
        :return: str
        """

        return '[ TID: ' + str(self.templateID) + ' // NAME: ' + self.templateName + ' // FIELD: ' + self.field \
               + ' // REGEX: {{ ' + self.rawRegex + ' }} ]'

