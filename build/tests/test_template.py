#!/usr/bin/python3

"""
test-template.py

APP: Inquisition
DESC: Unit test for Template.py library
CREATION_DATE: 2017-04-28

"""

# MODULES
# | Native
import unittest

# | Third-Party

# | Custom
from lib.anatomize.Template import Template

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class TemplateTestCase(unittest.TestCase):
    def setUp(self):
        # generate template
        self.template = Template(1, 'timestamp', '^\d$')

    def test_setRegex(self):
        # setRegex() is ran during __init__
        self.assertEqual(self.template.rawRegex, '^\d$')

        regexMatch = self.template.compiledRegex.search('1')
        self.assertEqual(regexMatch.group(), '1')

    def test_matchLogAgainstRegex(self):
        match = self.template.matchLogAgainstRegex('1')
        self.assertEqual(match, '1')

    def test_matchLogAgainstRegex_noLog(self):
        self.assertRaises(ValueError, self.template.matchLogAgainstRegex, '')
        self.assertRaises(ValueError, self.template.matchLogAgainstRegex, 0)
        self.assertRaises(ValueError, self.template.matchLogAgainstRegex, None)

if __name__ == '__main__':
    unittest.main()