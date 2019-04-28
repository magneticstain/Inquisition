#!/usr/bin/python3

"""
test_sage.py

APP: Inquisition
DESC: Unit test for Sage library
CREATION_DATE: 2017-11-12

"""

# MODULES
# | Native
import configparser
import unittest

# | Third-Party
from sklearn import svm

# | Custom
from lib.destiny.Sage import Sage

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__license__ = 'MIT'
__version__ = '2019.0.0.1-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class SageTestCase(unittest.TestCase):
    def setUp(self):
        # generate config
        cfg = configparser.ConfigParser()
        cfg.read('build/tests/unit_tests_GOOD.cfg')

        self.sage = Sage(cfg=cfg)

        # generate test log entries
        logData = {'field1': 'value', 'field2': 1}
        baselineLogData = { 'field1': 'value', 'field2': 1, 'threat': 0 }
        intelLogData = { 'field1': 'value', 'field2': 1, 'threat': 1 }
        self.sage.logDbHandle.hmset('log:non_existent_parser:1234', logData)
        self.sage.logDbHandle.hmset('baseline:log:non_existent_parser:1234', baselineLogData)
        self.sage.logDbHandle.hmset('intel:non_existent_intel:1234', intelLogData)

    def test_initClassifier(self):
        # init model and make sure it is an SVM instance
        self.sage.initClassifier()
        self.assertIsInstance(self.sage.networkThreatClassifier, svm.SVC)

    def test_gatherAllData(self):
        self.sage.gatherAllData()

        # check each expected log type
        # we should have at least one of each, so none should be == None
        self.assertIsNotNone(self.sage.logStore)
        self.assertIsNotNone(self.sage.baselineLogStore)
        self.assertIsNotNone(self.sage.intelLogStore)

    def test_processTestingResults(self):
        testResults = [0, 1]
        self.sage.gatherAllData()
        self.sage.processTestingResults(results=testResults)

        self.assertGreaterEqual(len(self.sage.alertNode.alertStore), 1)

    def tearDown(self):
        # remove test log entries
        self.sage.logDbHandle.delete('log:non_existent_parser:1234')
        self.sage.logDbHandle.delete('baseline:log:non_existent_parser:1234')
        self.sage.logDbHandle.delete('intel:non_existent_intel:1234')

if __name__ == '__main__':
    unittest.main()