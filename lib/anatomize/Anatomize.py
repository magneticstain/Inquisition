#!/usr/bin/python3

"""
Anatomize.py

APP: Inquisition
DESC: A library for reading in and parsing log files based on templates
CREATION_DATE: 2017-04-08

"""

# MODULES
# | Native
from os import fork
from time import sleep

# | Third-Party
from pymysql import InternalError, ProgrammingError, OperationalError

# | Custom
from lib.inquisit.Inquisit import Inquisit
from lib.anatomize.Parser import Parser

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class Anatomize(Inquisit):
    """
    A class used for reading in and parsing log files based on given field templates
    """

    parserStore = {}

    def __init__(self, cfg, sentryClient=None):
        Inquisit.__init__(self, cfg, lgrName=__name__, sentryClient=sentryClient)

        self.lgr.info('loading Anatomize.py instance...')

        # load parsers and associated templates
        try:
            self.parserStore = self.fetchParsers()
            self.lgr.debug('loaded [ ' + str(len(self.parserStore)) + ' ] parsers into parser store')
        except (InternalError, ProgrammingError) as e:
            self.lgr.critical('could not fetch parsers from inquisition database :: [ ' + str(e) + ' ]')
            if Inquisit.sentryClient:
                Inquisit.sentryClient.captureException()

            exit(1)

        self.lgr.info('loading of Anatomize.py [ COMPLETE ]')

    def fetchParsers(self):
        """
        Fetch parsing data from inquisition database

        :return: dict
        """

        parsers = {}

        # fetch parsers from DB
        sql = """
                SELECT 
                    parser_id, 
                    parser_name, 
                    parser_log 
                FROM 
                    Parsers 
                WHERE 
                    status = 1
              """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql)

            # fetch results
            dbResults = dbCursor.fetchall()
            for row in dbResults:
                # add each parser to parser store
                parsers[row['parser_id']] = Parser(cfg=self.cfg, logTTL=self.cfg['parsing']['logTTL'],
                                                   maxLogsToProcess=self.cfg.getint('parsing', 'maxLogsToParse'),
                                                   parserID=row['parser_id'], parserName=row['parser_name'],
                                                   logFile=row['parser_log'],
                                                   keepPersistentStats=self.cfg.getboolean('stats', 'keepPersistentStats'),
                                                   metricsMode=self.cfg.getboolean('logging', 'enableMetricsMode'),
                                                   baselineMode=self.cfg.getboolean('learning', 'enableBaselineMode'))

            dbCursor.close()

        return parsers

    def startAnatomizer(self):
        """
        Begin cycle of polling of each Parser

        :return: void
        """

        self.lgr.info('starting anatomizer...')

        hazyStateTrackingStatus = self.cfg.getboolean('state_tracking', 'enableHazyStateTracking')
        numLogsBetweenTrackingUpdate = self.cfg.getint('state_tracking', 'stateTrackingWaitNumLogs')

        # check if this is a test run
        try:
            testRun = self.cfg.getboolean('cli', 'test_run')
        except KeyError:
            # test run not defined, set to default of FALSE
            self.lgr.warning('test run flag not set, defaulting to [ FALSE ]')

            testRun = False

        # let user know if anatomizer was started in hazy state tracking mode
        if hazyStateTrackingStatus:
            self.lgr.info('hazy state tracking is [ ENABLED ] with updates set to occur every { '
                          + str(numLogsBetweenTrackingUpdate) + ' } logs read in')

        # cycle through parsers
        for parserId in self.parserStore:
            newParserPID = 0
            if not testRun:
                # fork process before beginning read
                self.lgr.debug('forking off parser [ ' + str(parserId) + ' - ' + self.parserStore[parserId].parserName
                               + ' ] to child process')
                newParserPID = fork()

            if newParserPID == 0:
                # in child process, bounce inquisition DB handle (see issue #66)
                try:
                    self.bounceInquisitionDbConnection()
                except OperationalError as e:
                    self.lgr.critical('could not create database connection :: [ ' + str(e) + ' ]')
                    if self.sentryClient:
                        self.sentryClient.captureException()

                    exit(1)

                # start parsing
                numRuns = 0
                numRunsBetweenStats = int(self.cfg['parsing']['numSleepsBetweenStats'])
                sleepTime = int(self.cfg['parsing']['sleepTime'])
                while True:
                    # poll for new logs
                    self.parserStore[parserId].pollLogFile(isTestRun=testRun, useHazyStateTracking=hazyStateTrackingStatus,
                                                           numLogsBetweenTrackingUpdate=numLogsBetweenTrackingUpdate)

                    # check if running a test run
                    if testRun:
                        self.lgr.debug('test run, exiting anatomizer loop')
                        break

                    # run complete, increase counter
                    numRuns += 1
                    if numRuns >= numRunsBetweenStats:
                        # time to print stats and reset run counter
                        self.lgr.info('|-- PARSER STATS - GENERAL --| :: ' + str(self.parserStore[parserId]) + ' :: '
                                      + self.parserStore[parserId].printStats())

                        numRuns = 0

                    self.lgr.debug('sleeping for [ ' + self.cfg['parsing']['sleepTime'] + ' ] seconds')
                    sleep(sleepTime)

