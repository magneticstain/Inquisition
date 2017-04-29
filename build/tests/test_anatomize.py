#!/usr/bin/python3

"""
test-anatomize.py

APP: Inquisition
DESC: Unit test for Anatomize.py library
CREATION_DATE: 2017-04-28

"""

# MODULES
# | Native
import configparser
import logging
import unittest

# | Third-Party
import pymysql
import redis

# | Custom
from lib.anatomize.Anatomize import Anatomize

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class AnatomizeTestCase(unittest.TestCase):
    def setUp(self):
        # generate config
        cfg = configparser.ConfigParser()
        cfg.read('build/tests/unit_tests_GOOD.cfg')

        self.anatomizer = Anatomize(cfg)

    def test_generateLogger(self):
        self.assertIsInstance(self.anatomizer.lgr, logging.Logger)

    def test_generateInquisitionDbConnection(self):
        self.assertIsInstance(self.anatomizer.inquisitionDbHandle, pymysql.connections.Connection)

if __name__ == '__main__':
    unittest.main()