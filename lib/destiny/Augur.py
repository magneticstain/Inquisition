#!/usr/bin/python3

"""
Augur.py

APP: Inquisition
DESC: A library used to fetch and receive OSINT data used for further learning
CREATION_DATE: 2017-05-14

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


class Augur(Inquisit):
    """
    OSINT aggreegation utility
    """

    def __init__(self, cfg):
        Inquisit.__init__(self, cfg, lgrName=__name__)


