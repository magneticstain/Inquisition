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

    def test_fetchParsers(self):
        self.assertGreater(len(self.anatomizer.parserStore), 0)

    def test_startAnatomizer_noTestRunSetting(self):
        try:
            self.anatomizer.startAnatomizer()

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except configparser.NoSectionError:
            self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()