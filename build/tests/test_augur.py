#!/usr/bin/python3

"""
test_augur.py

APP: Inquisition
DESC: Unit test for Augur library
CREATION_DATE: 2017-11-25

"""

# MODULES
# | Native
import configparser
import unittest

# | Third-Party
from bs4 import BeautifulSoup as BSoup

# | Custom
from lib.destiny.Augur import Augur

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class AugurTestCase(unittest.TestCase):
    def setUp(self):
        # generate config
        cfg = configparser.ConfigParser()
        cfg.read('build/tests/unit_tests_GOOD.cfg')

        self.augur = Augur(cfg=cfg)

    def test_getXMLSrcData_validURL(self):
        responseData = self.augur.getXMLSrcData(url='https://isc.sans.edu/api/openiocsources/')

        self.assertIsInstance(responseData, BSoup)

    def test_getXMLSrcData_invalidURL(self):
        responseData = self.augur.getXMLSrcData(url='https://invalid.url/')

        self.assertEqual(responseData, {})

    def test_getXMLSrcData_blankURL(self):
        try:
            responseData = self.augur.getXMLSrcData(url='')
        except ValueError:
            self.assertTrue(True)

    def test_mapIOCItemNameToFieldName(self):
        fieldName = self.augur.mapIOCItemNameToFieldName(iocItemName='remoteIP')

        self.assertEqual(fieldName, 'src_ip')

    def test_mapIOCItemNameToFieldName_blankFieldName(self):
        try:
            fieldName = self.augur.mapIOCItemNameToFieldName(iocItemName='')
        except ValueError:
            self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()