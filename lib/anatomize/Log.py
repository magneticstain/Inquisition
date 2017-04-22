#!/usr/bin/python3

"""
Log.py

APP: Inquisition
DESC: Logical representation of a parsed log
CREATION_DATE: 2017-04-18

"""

# MODULES
# | Native

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


class Log:
    sourceParserID = 0
    sourceApplication = ''
    timestamp = ''
    device = ''

    def __init__(self, templateID, field, regex, templateName='Default'):
        self.templateID = templateID
        self.templateName = templateName
        self.field = field

