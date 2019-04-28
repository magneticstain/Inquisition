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
__license__ = 'MIT'
__version__ = '2019.0.0.1-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class Template:
    """
    Logical representation of template with all the bells and whistles
    """

    templateID = 0
    templateName = ''
    field = ''
    rawRegex = ''
    regexGrp = 0
    regexMatchIdx = 0
    compiledRegex = None

    def __init__(self, templateID, field, regex, regexGrp=0, regexMatchIdx=0, templateName='Default'):
        self.templateID = templateID
        self.templateName = templateName
        self.field = field

        self.setRegex(regex, regexGrp, regexMatchIdx)

    def setRegex(self, regex, regexGrp, regexMatchIdx):
        """
        Sets raw and compiled regex from provided regex pattern, as well as associated matching options

        :param regex: raw regex pattern
        :param regexGrp: regex group number to match on
        :param regexMatchIdx: index of match to use
        :return: void
        """

        # set raw regex
        self.rawRegex = regex

        # set regex group number and match index
        regexGrp = int(regexGrp)
        regexMatchIdx = int(regexMatchIdx)
        if 0 <= regexGrp and 0 <= regexMatchIdx:
            self.regexGrp = regexGrp
            self.regexMatchIdx = regexMatchIdx
        else:
            raise ValueError('invalid regex match options :: [ GROUP: { ' + str(regexGrp) + ' } || MATCH IDX: {  ' + str(regexMatchIdx) + ' } ]')

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
        regexMatches = self.compiledRegex.findall(log)

        # get specified match based on idx num
        regexMatch = regexMatches[self.regexMatchIdx]

        if regexMatch:
            # match found, see if we need to specify by group
            if isinstance(regexMatch, tuple):
                # multiple regex groups found in match - use specified group
                matchedString = regexMatch[self.regexGrp]
            else:
                # only one group found, use as match value
                matchedString = regexMatch

            # strip surrounding whitespace
            matchedString = matchedString.strip(" \t\n\r")

        return matchedString

    def __str__(self):
        """
        Override __str__special method to print template metadata when obj is treated as a string

        :return: str
        """

        return '[ TID: ' + str(self.templateID) + ' // NAME: ' + self.templateName + ' // FIELD: ' + self.field \
               + ' // REGEX: {{ ' + self.rawRegex + ' }} // GRP: { ' + str(self.regexGrp) + ' } ||  MATCH_IDX: { ' \
               + str(self.regexMatchIdx) + ' } ]'

