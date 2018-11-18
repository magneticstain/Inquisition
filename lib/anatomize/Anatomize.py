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
                parsers[row['parser_id']] = Parser(cfg=self.cfg,
                                                   logTTL=self.getCfgValue(section='parsing', name='logTTL',
                                                                           defaultVal=60),
                                                   maxLogsToProcess=self.getCfgValue(section='parsing',
                                                                                         name='maxLogsToParse',
                                                                                         defaultVal=-1, dataType=int),
                                                   parserID=row['parser_id'], parserName=row['parser_name'],
                                                   logFile=row['parser_log'],
                                                   keepPersistentStats=self.getCfgValue(section='stats',
                                                                                        name='keepPersistentStats',
                                                                                        defaultVal=True, dataType=bool),
                                                   metricsMode=self.getCfgValue(section='logging',
                                                                                name='enableMetricsMode',
                                                                                defaultVal=False, dataType=bool),
                                                   baselineMode=self.getCfgValue(section='learning',
                                                                                 name='enableBaselineMode',
                                                                                 defaultVal=False, dataType=bool))

            dbCursor.close()

        return parsers

    def startAnatomizer(self):
        """
        Begin cycle of polling of each Parser

        :return: void
        """

        self.lgr.info('starting anatomizer...')

        hazyStateTrackingStatus = self.getCfgValue(section='state_tracking', name='enableHazyStateTracking',
                                                   defaultVal=True, dataType=bool)
        numLogsBetweenTrackingUpdate = self.getCfgValue(section='state_tracking', name='stateTrackingWaitNumLogs',
                                                            defaultVal=1, dataType=int)

        # let user know if anatomizer was started in hazy state tracking mode
        if hazyStateTrackingStatus:
            self.lgr.info('hazy state tracking is [ ENABLED ] with updates set to occur every { '
                          + str(numLogsBetweenTrackingUpdate) + ' } logs read in')

        # check if this is a test run
        testRun = self.getCfgValue(section='cli', name='test_run', defaultVal=False, dataType=bool)

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
                numRunsBetweenStats = self.getCfgValue(section='parsing', name='numSleepsBetweenStats', defaultVal=5,
                                                       dataType=int)
                sleepTime = self.getCfgValue(section='parsing', name='sleepTime', defaultVal=5, dataType=int)
                while True:
                    # poll for new logs
                    try:
                        self.parserStore[parserId].pollLogFile(isTestRun=testRun,
                                                               useHazyStateTracking=hazyStateTrackingStatus,
                                                               numLogsBetweenTrackingUpdate=numLogsBetweenTrackingUpdate)
                    except (FileNotFoundError, ValueError) as e:
                        self.lgr.error('error reading parser file :: [ ' + str(e) + ' ]')

                    # run complete, increase counter
                    numRuns += 1
                    if numRuns >= numRunsBetweenStats:
                        # time to print stats and reset run counter
                        self.lgr.info('|-- PARSER STATS - GENERAL --| :: ' + str(self.parserStore[parserId]) + ' :: '
                                      + self.parserStore[parserId].printStats())

                        numRuns = 0

                    # check if running a test run
                    if testRun:
                        self.lgr.debug('test run, exiting anatomizer loop')
                        break

                    self.lgr.debug('sleeping for [ ' + str(sleepTime) + ' ] seconds')
                    sleep(sleepTime)

