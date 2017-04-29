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
import redis

# | Custom
from lib.anatomize.Anatomize import Anatomize
from lib.anatomize.Parser import Parser

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
        self.parser = self.anatomizer.parserStore[2]

    def test_fetchTemplates(self):
        self.assertGreater(len(self.parser.templateStore), 0)

    def test_updateStatInLogDB(self):
        statKey = '2_fake_apache_logs'
        statName = 'total_logs_processed'

        # set log
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

if __name__ == '__main__':
    unittest.main()