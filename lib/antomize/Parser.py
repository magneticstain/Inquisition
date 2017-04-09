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

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development|Staging|Production'


class Parser:
    logName = ''
    logFile = ''
    templateStore = []

    def __init__(self, logName='Syslog', logFile='/var/log/syslog'):
        self.logName = logName
        self.logFile = logFile

        # load templates for template store
        # TODO
        self.templateStore = None
