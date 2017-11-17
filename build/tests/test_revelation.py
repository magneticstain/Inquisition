#!/usr/bin/python3

"""
test_destiny.py

APP: Inquisition
DESC: Unit test for Revelation library
CREATION_DATE: 2017-11-17

"""

# MODULES
# | Native
import configparser
import unittest
from time import time

# | Third-Party

# | Custom
from lib.revelation.Revelation import Revelation

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class RevelationTestCase(unittest.TestCase):
    def setUp(self):
        # generate config
        cfg = configparser.ConfigParser()
        cfg.read('build/tests/unit_tests_GOOD.cfg')

        self.revelation = Revelation(cfg=cfg)

    def test_addAlert_defaultParams(self):
        self.revelation.addAlert(addAlertToDb=False)
        self.assertGreater(len(self.revelation.alertStore), 0)

    def test_addAlert_allParamsSet(self):
        self.revelation.addAlert(timestamp=time(), alertType=1, status=1, host='HOSTNAME1', srcNode='1.1.1.1',
                                 dstNode='2.2.2.2', alertDetails='test details', addAlertToDb=False)
        self.assertGreater(len(self.revelation.alertStore), 0)

    def test_addAlert_invalidTimestamp(self):
        try:
            self.revelation.addAlert(timestamp=-1, addAlertToDb=False)
        except ValueError:
            self.assertTrue(True)

        try:
            self.revelation.addAlert(timestamp=-1000000000, addAlertToDb=False)
        except ValueError:
            self.assertTrue(True)

    def test_addAlert_invalidAlertType(self):
        try:
            self.revelation.addAlert(alertType=-1, addAlertToDb=False)
        except ValueError:
            self.assertTrue(True)

        try:
            self.revelation.addAlert(alertType=-1000000000, addAlertToDb=False)
        except ValueError:
            self.assertTrue(True)

    def test_addAlert_invalidStatus(self):
        try:
            self.revelation.addAlert(status=-1, addAlertToDb=False)
        except ValueError:
            self.assertTrue(True)

        try:
            self.revelation.addAlert(status=-1000000000, addAlertToDb=False)
        except ValueError:
            self.assertTrue(True)

        try:
            self.revelation.addAlert(status=3, addAlertToDb=False)
        except ValueError:
            self.assertTrue(True)

        try:
            self.revelation.addAlert(status=30000000000000000, addAlertToDb=False)
        except ValueError:
            self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()