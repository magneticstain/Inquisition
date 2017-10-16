#!/usr/bin/python3

"""

APP: Inquisition
DESC: Revelation.py - alert framework for use with detection engines
CREATION_DATE: 2017-10-15

"""

# MODULES
# | Native

# | Third-Party

# | Custom
from lib.inquisit.Inquisit import Inquisit

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'



class Revelation(Inquisit):
    """
    Alert framework for use with analysis engines
    """

    def __init__(self, cfg, lgrName, sentryClient=None):
        Inquisit.__init__(self, cfg, lgrName=lgrName, sentryClient=sentryClient)


