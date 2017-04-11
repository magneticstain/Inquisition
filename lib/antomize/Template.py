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

