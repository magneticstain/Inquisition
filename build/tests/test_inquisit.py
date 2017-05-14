#!/usr/bin/python3

"""
test-inquisit.py

APP: Inquisition
DESC: Unit test for Inquisit.py library
CREATION_DATE: 2017-05-13

"""

# MODULES
# | Native
import configparser
import logging
import unittest

# | Third-Party
import pymysql

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


class InquisitTestCase(unittest.TestCase):
    def setUp(self):
        # generate config
        cfg = configparser.ConfigParser()
        cfg.read('build/tests/unit_tests_GOOD.cfg')

        self.inquisit = Inquisit(cfg)

    def test_generateLogger(self):
        self.assertIsInstance(self.inquisit.lgr, logging.Logger)

    def test_generateInquisitionDbConnection(self):
        self.assertIsInstance(self.inquisit.inquisitionDbHandle, pymysql.connections.Connection)

if __name__ == '__main__':
    unittest.main()