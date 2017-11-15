#!/usr/bin/python3

"""
test_destiny.py

APP: Inquisition
DESC: Unit test for Destiny library
CREATION_DATE: 2017-11-04

"""

# MODULES
# | Native
import configparser
import unittest

# | Third-Party

# | Custom
from lib.destiny.Destiny import Destiny

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class DestinyTestCase(unittest.TestCase):
    def setUp(self):
        # generate config
        cfg = configparser.ConfigParser()
        cfg.read('build/tests/unit_tests_GOOD.cfg')

        self.destiny = Destiny(cfg=cfg, lgrName=__name__)

        # generate test log entries
        logData = {'field1': 'value', 'field2': 1}
        baselineLogData = { 'field1': 'value', 'field2': 1, 'threat': 0 }
        intelLogData = { 'field1': 'value', 'field2': 1, 'threat': 1 }
        self.destiny.logDbHandle.hmset('log:non_existent_parser:1234', logData)
        self.destiny.logDbHandle.hmset('baseline:log:non_existent_parser:1234', baselineLogData)
        self.destiny.logDbHandle.hmset('intel:non_existent_intel:1234', intelLogData)

    def test_fetchLogData_default(self):
        logSet = self.destiny.fetchLogData()
        self.assertGreater(len(logSet), 0)

    def test_fetchLogData_raw(self):
        logSet = self.destiny.fetchLogData(logType='raw')
        self.assertGreater(len(logSet), 0)

    def test_fetchLogData_baseline(self):
        logSet = self.destiny.fetchLogData(logType='baseline')
        self.assertGreater(len(logSet), 0)

    def test_fetchLogData_intel(self):
        logSet = self.destiny.fetchLogData(logType='intel')
        self.assertGreater(len(logSet), 0)

    def test_fetchLogData_invalidLogType(self):
        try:
            logSet = self.destiny.fetchLogData(logType='invalid')
        except ValueError:
            self.assertTrue(True)

    def test_getUniqueLogDataFields(self):
        logSet = self.destiny.fetchLogData()
        uniqueFields = self.destiny.getUniqueLogDataFields(logSet)

        self.assertGreater(len(uniqueFields), 0)

    def test_initializeLogData(self):
        logSet = self.destiny.fetchLogData('baseline')
        uniqueFields = self.destiny.getUniqueLogDataFields(logSet)
        encTrainingData, targetData = self.destiny.initializeLogData(logData=logSet, uniqueFields=uniqueFields,
                                                             dataUsage='training', targetFieldName='threat')

        logSet = self.destiny.fetchLogData('raw')
        encTestingData = self.destiny.initializeLogData(logData=logSet, uniqueFields=uniqueFields, dataUsage='testing')

        self.assertIsNotNone(encTrainingData)
        self.assertGreater(len(targetData), 0)
        self.assertIsNotNone(encTestingData)

    def test_initializeLogData_noLogData(self):
        logSet = self.destiny.fetchLogData('baseline')
        uniqueFields = self.destiny.getUniqueLogDataFields(logSet)

        try:
            encTrainingData, targetData = self.destiny.initializeLogData(logData={}, uniqueFields=uniqueFields,
                                                             dataUsage='training', targetFieldName='threat')
        except ValueError:
            self.assertTrue(True)

    def test_initializeLogData_noUniqueFields(self):
        logSet = self.destiny.fetchLogData('baseline')

        try:
            encTrainingData, targetData = self.destiny.initializeLogData(logData=logSet, uniqueFields=[],
                                                                     dataUsage='training', targetFieldName='threat')
        except ValueError:
            self.assertTrue(True)

    def test_initializeLogData_invalidDataUsageOption(self):
        logSet = self.destiny.fetchLogData('baseline')
        uniqueFields = self.destiny.getUniqueLogDataFields(logSet)

        try:
            encTrainingData, targetData = self.destiny.initializeLogData(logData=logSet, uniqueFields=uniqueFields,
                                                                         dataUsage='invalidOption',
                                                                         targetFieldName='threat')
        except ValueError:
            self.assertTrue(True)

    def test_initializeLogData_invalidTargetFieldName(self):
        logSet = self.destiny.fetchLogData('baseline')
        uniqueFields = self.destiny.getUniqueLogDataFields(logSet)

        try:
            encTrainingData, targetData = self.destiny.initializeLogData(logData=logSet, uniqueFields=uniqueFields,
                                                             dataUsage='training', targetFieldName='invalidTFN')
        except ValueError:
            self.assertTrue(True)

    def test_initializeLogData_sendTrainingDataWithoutTFN(self):
        logSet = self.destiny.fetchLogData('baseline')
        uniqueFields = self.destiny.getUniqueLogDataFields(logSet)

        try:
            encTrainingData, targetData = self.destiny.initializeLogData(logData=logSet, uniqueFields=uniqueFields,
                                                                         dataUsage='training')
        except RuntimeError:
            self.assertTrue(True)

    def tearDown(self):
        # remove test log entries
        self.destiny.logDbHandle.delete('log:non_existent_parser:1234')
        self.destiny.logDbHandle.delete('baseline:log:non_existent_parser:1234')
        self.destiny.logDbHandle.delete('intel:non_existent_intel:1234')

if __name__ == '__main__':
    unittest.main()