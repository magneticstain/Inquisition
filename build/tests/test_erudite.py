#!/usr/bin/python3

"""
test_erudite.py

APP: Inquisition
DESC: Unit test for Erudite library
CREATION_DATE: 2017-11-12

"""

# MODULES
# | Native
import configparser
import unittest
from time import sleep,time

# | Third-Party
from sklearn import svm

# | Custom
from lib.destiny.Erudite import Erudite

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class EruditeTestCase(unittest.TestCase):
    def setUp(self):
        # generate config
        cfg = configparser.ConfigParser()
        cfg.read('build/tests/unit_tests_GOOD.cfg')

        self.erudite = Erudite(cfg=cfg)

        # generate test log entries
        logData = {'field1': 'value', 'field2': 'value2'}
        baselineLogData = { 'field1': 'value', 'field2': 1, 'threat': 0 }
        intelLogData = { 'field1': 'value', 'field2': 1, 'threat': 1 }
        self.erudite.logDbHandle.hmset('log:non_existent_parser:1234', logData)
        self.erudite.logDbHandle.hmset('baseline:log:non_existent_parser:1234', baselineLogData)
        self.erudite.logDbHandle.hmset('intel:non_existent_intel:1234', intelLogData)

    def test_fetchKnownHostData(self):
        knownHosts = self.erudite.fetchKnownHostData()

        self.assertIsInstance(knownHosts, list)

    def test_getFieldNameFromType(self):
        # there should currently be three field types, with IDs 1,2,3
        # we should check for all of them

        self.assertIsNotNone(self.erudite.getFieldNameFromType(typeID=1))
        self.assertIsNotNone(self.erudite.getFieldNameFromType(typeID=2))
        self.assertIsNotNone(self.erudite.getFieldNameFromType(typeID=3))

    def test_getFieldNameFromType_nonExistentTypeID(self):
        # here we're testing a lookup for a very large, known non-existent  type ID
        self.assertEqual(self.erudite.getFieldNameFromType(typeID=1000000000000), '')

    def test_getFieldNameFromType_negativeTypeID(self):
        # here we're testing a lookup for a negative type ID
        self.assertEqual(self.erudite.getFieldNameFromType(typeID=-1), '')
        self.assertEqual(self.erudite.getFieldNameFromType(typeID=-1000000000000), '')

    def test_identifyUnknownHosts(self):
        unknownHosts = self.erudite.identifyUnknownHosts(hostFieldName='field1')
        self.assertEqual(unknownHosts, [])

    def test_identifyUnknownHosts_withLogs(self):
        # test after reading in logs as well
        self.erudite.logStore = self.erudite.fetchLogData(logType='raw')
        unknownHosts = self.erudite.identifyUnknownHosts(hostFieldName='field1')
        self.assertIn('value', unknownHosts)

    def test_identifyUnknownHosts_blankHFN(self):
        try:
            unknownHosts = self.erudite.identifyUnknownHosts(hostFieldName='')
        except ValueError:
            self.assertTrue(True)

    def test_calculateNodeOccurrenceCounts_withLogs(self):
        self.erudite.logStore = self.erudite.fetchLogData(logType='raw')
        self.erudite.initTrafficNodeAnalysisCalculations()
        self.erudite.calculateNodeOccurrenceCounts(nodeFieldName='field2', nodeFieldType='src')

        # check to see if count was recorded correctly
        self.assertGreaterEqual(self.erudite.nodeCounts['src']['value2'], 1)

    def test_calculateNodeOccurrenceCounts_blankFieldName(self):
        try:
            self.erudite.calculateNodeOccurrenceCounts(nodeFieldName='', nodeFieldType='src')
        except ValueError:
            self.assertTrue(True)

    def test_calculateNodeOccurrenceCounts_blankFieldType(self):
        try:
            self.erudite.calculateNodeOccurrenceCounts(nodeFieldName='field2', nodeFieldType='')
        except ValueError:
            self.assertTrue(True)

    def test_calculateOPSForNode_defaultTimes(self):
        # run function with default class variables
        # times should both be zero, which is invalid
        try:
            OPS = self.erudite.calculateOPSForNode(occurrenceCount=1)
        except ValueError:
            self.assertTrue(True)

    def test_calculateOPSForNode_zeroedTimes(self):
        self.erudite.runStartTime = 0
        self.erudite.runEndTime = 0
        try:
            OPS = self.erudite.calculateOPSForNode(occurrenceCount=1)
        except ValueError:
            self.assertTrue(True)

    def test_calculateOPSForNode_negativeTimes(self):
        self.erudite.runStartTime = -1
        self.erudite.runEndTime = -100000000000000000
        try:
            OPS = self.erudite.calculateOPSForNode(occurrenceCount=1)
        except ValueError:
            self.assertTrue(True)

    def test_calculateOPSForNode_validTimes(self):
        self.erudite.runStartTime = time()
        sleep(5)
        self.erudite.runEndTime = time()
        OPS = self.erudite.calculateOPSForNode(occurrenceCount=5)

        self.assertEqual(round(OPS, ndigits=2), 1)

    def test_calculateOPSForNodeSet_invalidNodeType(self):
        try:
            self.erudite.calculateOPSForNodeSet(nodeSetType='invalid!!')
        except ValueError:
            self.assertTrue(True)

    def test_determineOPSStdDevSignificance_insignificantStdDev(self):
        stdDev = self.erudite.determineOPSStdDevSignificance(node='unit_test', nodeType='src',
                                                             prevNodeTrafficResult=0.00000000000001,
                                                             currentNodeTrafficResult=0.00000000000002)

        self.assertFalse(stdDev)

    def test_determineOPSStdDevSignificance_significantStdDev(self):
        stdDev = self.erudite.determineOPSStdDevSignificance(node='unit_test', nodeType='src',
                                                             prevNodeTrafficResult=0.1234,
                                                             currentNodeTrafficResult=23457267)

        self.assertTrue(stdDev)

    def test_determineOPSStdDevSignificance_invalidPrevNodeTrafficResults(self):
        try:
            self.erudite.determineOPSStdDevSignificance(node='unit_test', nodeType='src',
                                                             prevNodeTrafficResult=-1,
                                                             currentNodeTrafficResult=23457267)
        except ValueError:
            self.assertTrue(True)

    def test_determineOPSStdDevSignificance_invalidCurrentNodeTrafficResults(self):
        try:
            self.erudite.determineOPSStdDevSignificance(node='unit_test', nodeType='src',
                                                             prevNodeTrafficResult=1234,
                                                             currentNodeTrafficResult=-123)
        except ValueError:
            self.assertTrue(True)

    def tearDown(self):
        # remove test log entries
        self.erudite.logDbHandle.delete('log:non_existent_parser:1234')
        self.erudite.logDbHandle.delete('baseline:log:non_existent_parser:1234')
        self.erudite.logDbHandle.delete('intel:non_existent_intel:1234')

if __name__ == '__main__':
    unittest.main()