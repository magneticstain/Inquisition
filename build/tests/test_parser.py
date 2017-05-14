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
import unittest

# | Third-Party

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


class ParserTestCase(unittest.TestCase):
    def setUp(self):
        # generate config
        cfg = configparser.ConfigParser()
        cfg.read('build/tests/unit_tests_GOOD.cfg')

        self.anatomizer = Anatomize(cfg)
        self.parser = self.anatomizer.parserStore[2]

    def test_fetchTemplates(self):
        self.assertGreater(len(self.parser.templateStore), 0)

    def test_updateStatInLogDB(self):
        statKey = '2_fake_apache_logs'
        statName = 'total_logs_processed'

        # set stat
        self.parser.updateStatInLogDB(statName=statName, statKey=statKey, newVal=0, action='set')
        currentNumLogs = int(self.parser.logDbHandle.hget('stats:parser:' + statKey, statName).decode('utf-8'))
        self.assertEqual(currentNumLogs, 0)

        # update stat by increasing it
        self.parser.updateStatInLogDB(statName=statName, incrAmt=1)

        # get new num logs
        newNumLogs = int(self.parser.logDbHandle.hget('stats:parser:' + statKey, statName).decode('utf-8'))

        # check to see if new num logs is 1 more than the current num logs
        self.assertEqual(newNumLogs, currentNumLogs + 1)

    def test_updateStatInLogDB_strictInvalidKey(self):
        statKey = '2_fake_apache'
        statName = 'doesn\'t_exist'

        try:
            # set log
            self.parser.updateStatInLogDB(statName=statName, statKey=statKey, incrAmt=1, strict=True)

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except IndexError:
            self.assertTrue(True)

    def test_updateStatInLogDB_invalidIncrAmt(self):
        statKey = '2_fake_apache_logs'
        statName = 'total_logs_processed'

        try:
            # set log
            self.parser.updateStatInLogDB(statName=statName, statKey=statKey, incrAmt=-5)

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except ValueError:
            self.assertTrue(True)

    def test_updateStatInLogDB_invalidAction(self):
        statKey = '2_fake_apache_logs'
        statName = 'total_logs_processed'

        try:
            # set log
            self.parser.updateStatInLogDB(statName=statName, statKey=statKey, action='bad_action', newVal=5)

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except ValueError:
            self.assertTrue(True)

    def test_incrStat(self):
        statName = 'total_logs_processed'
        self.parser.resetParserStats(statType=statName)

        # increase TLP
        self.parser.incrStat(statKey=statName, amt=1)

        self.assertEqual(self.parser.stats[statName], 1)

    def test_incrStat_invalidIncrAmt(self):
        try:
            statName = 'total_logs_processed'

            self.parser.incrStat(statKey=statName, amt=-1)

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except ValueError:
            self.assertTrue(True)

    def test_incrStat_strictInvalidKey(self):
        try:
            statName = 'total_logs_processed'

            self.parser.incrStat(statKey=statName, amt=1, strict=True)

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except IndexError:
            self.assertTrue(True)

    def test_avgStat(self):
        statName = 'average_log_length'
        initialVal = 1
        newVal = 5
        numValsCurrentlyInSet = 1

        # set stat
        self.parser.stats[statName] = initialVal

        self.parser.avgStat(statKey=statName, initialVal=initialVal, newVal=newVal, numValsInSet=numValsCurrentlyInSet)

        calcAvg = self.parser.stats[statName]
        actualAvg = (initialVal + newVal) / (numValsCurrentlyInSet + 1)

        self.assertEqual(calcAvg, actualAvg)

    def test_avgStat_strictInvalidKey(self):
        statName = 'average_log_length'
        initialVal = 1
        newVal = 5
        numValsInSet = 2

        del self.parser.stats[statName]

        try:
            self.parser.avgStat(statKey=statName, initialVal=initialVal, newVal=newVal, numValsInSet=numValsInSet
                                , strict=True)

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except IndexError:
            self.assertTrue(True)

    def test_avgStat_invalidNumValsInSet(self):
        statName = 'average_log_length'
        initialVal = 1
        newVal = 5
        numValsInSet = -1000

        try:
            self.parser.avgStat(statKey=statName, initialVal=initialVal, newVal=newVal, numValsInSet=numValsInSet
                                , strict=True)

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except ValueError:
            self.assertTrue(True)

    def test_avgStat_checkDbVals(self):
        statKey = '2_fake_apache_logs'
        statName = 'average_log_length'
        initialVal = 1
        newVal = 5
        numValsCurrentlyInSet = 1

        # set stat
        self.parser.stats[statName] = initialVal

        self.parser.avgStat(statKey=statName, initialVal=initialVal, newVal=newVal, numValsInSet=numValsCurrentlyInSet
                            , storeInDb=True)

        inMemAvg = self.parser.stats[statName]
        actualAvg = (initialVal + newVal) / (numValsCurrentlyInSet + 1)

        # check val in db
        logDbAvgStat = float(self.parser.logDbHandle.hget('stats:parser:' + statKey, statName).decode('utf-8'))

        self.assertEqual(inMemAvg, logDbAvgStat)
        self.assertEqual(actualAvg, logDbAvgStat)

    def test_resetParserStats_specificStatAndVal(self):
        statKey = '2_fake_apache_logs'
        statName = 'total_logs_processed'

        # set stat
        self.parser.stats[statName] = 0

        self.parser.resetParserStats(statType='total_logs_processed', statData=1)

        self.assertEqual(self.parser.stats[statName], 1)

        # get val in db
        logDbStatVal = int(self.parser.logDbHandle.hget('stats:parser:' + statKey, statName).decode('utf-8'))
        self.assertEqual(logDbStatVal, 1)

    def test_printStats(self):
        self.parser.resetParserStats()
        statString = self.parser.printStats()

        self.assertIs(type(statString), str)

    def test_printStats_raw(self):
        self.parser.resetParserStats()
        statString = self.parser.printStats(raw=True)

        self.assertIs(type(statString), dict)

    def test_parseLog(self):
        self.assertTrue(self.parser.parseLog(rawLog='raw log'))

    def test_parseLog_invalidLogTTL(self):
        # set log TTL to invalid values
        self.parser.logTTL = 0
        try:
            self.parser.parseLog(rawLog='164.169.65.152')

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except ValueError:
            self.assertTrue(True)

    def test_processLog(self):
        self.parser.resetParserStats(statType='total_logs_processed')

        self.assertTrue(self.parser.processLog('raw log'))

    def test_pollLogFile_useHazyStateTracking(self):
        try:
            self.parser.pollLogFile(useHazyStateTracking=True, numLogsBetweenTrackingUpdate=0)

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except ValueError:
            self.assertTrue(True)

        try:
            self.parser.pollLogFile(useHazyStateTracking=True, numLogsBetweenTrackingUpdate=-10000)

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except ValueError:
            self.assertTrue(True)

    def test_pollLogFile_nonExistantFile(self):
        try:
            self.parser.logFile = '/var/log/non_existant_file'

            self.parser.pollLogFile()

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except Exception:
            self.assertTrue(True)

    def test_pollLogFile_nonAccessibleFile(self):
        try:
            self.parser.logFile = '/var/log/inaccessible_test_log'

            self.parser.pollLogFile()

            # if we get here, we didn't get to where we expected; considered failure
            self.assertTrue(False)
        except Exception:
            self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()