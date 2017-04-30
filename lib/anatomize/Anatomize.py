#!/usr/bin/python3

"""
Anatomize.py

APP: Inquisition
DESC: A library for reading in and parsing log files based on templates
CREATION_DATE: 2017-04-08

"""

# MODULES
# | Native
import logging
from os import fork
from time import sleep

# | Third-Party
import pymysql
import redis

# | Custom
from lib.anatomize.Parser import Parser

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class Anatomize:
    """
    Anatomize.py is a class used for reading in and parsing log files based on given field templates
    """

    lgr = None
    cfg = {}
    inquisitionDbHandle = None
    logDbHandle = None
    parserStore = {}

    def __init__(self, cfg):
        self.cfg = cfg

        # start logger
        self.lgr = self.generateLogger()

        self.lgr.info('starting Anatomize engine...')

        # create db handle for log database
        # NOTE: StrictRedis won't actually raise an exception if we can't connect; only when we run queries
        # go figure -_-
        self.logDbHandle = redis.StrictRedis(host=cfg['log_database']['host'], port=cfg['log_database']['port'])
        self.lgr.debug('database connection established for log database :: [ ' + cfg['log_database']['host']
                       + ':' + cfg['log_database']['port'] + ' ]')

        # create connection to inquisition db
        try:
            self.inquisitionDbHandle = self.generateInquisitionDbConnection(cfg['mysql_database']['db_user'],
                                                                            cfg['mysql_database']['db_pass'],
                                                                            cfg['mysql_database']['db_name'],
                                                                            cfg['mysql_database']['db_host'],
                                                                            int(cfg['mysql_database']['db_port']))
            self.lgr.debug('database connection established for main inquisition database :: [ '
                           + cfg['mysql_database']['db_host'] + ':' + cfg['mysql_database']['db_port'] + ' ]')
            self.lgr.info('all database connections established [ SUCCESSFULLY ]')

            # load parsers and associated templates (IN PROGRESS)
            self.parserStore = self.fetchParsers()
            self.lgr.debug('loaded [ ' + str(len(self.parserStore)) + ' ] parsers into parser store')
        except (pymysql.InternalError, pymysql.ProgrammingError) as e:
            self.lgr.critical('could not fetch parsers from inquisition database :: [ ' + str(e) + ' ]')

            exit(1)
        except pymysql.OperationalError as e:
            self.lgr.critical('could not create database connection :: [ ' + str(e) + ' ]')

            exit(1)

    def generateLogger(self):
        """
        Generate logging handler with given info
        
        :return: logger 
        """

        # initialize logger
        newLgr = logging.getLogger(__name__)

        # set logging level
        logLvl = getattr(logging, self.cfg['logging']['logLvl'].upper())
        newLgr.setLevel(logLvl)

        # create file handler for log file
        fileHandler = logging.FileHandler(self.cfg['logging']['logFile'])
        fileHandler.setLevel(logLvl)

        # set output formatter
        # NOTE: we need to get the logFormat val with the raw flag set in order to avoid logging from interpolating
        frmtr = logging.Formatter(self.cfg.get('logging', 'logFormat', raw=True))
        fileHandler.setFormatter(frmtr)

        # associate file handler w/ logger
        newLgr.addHandler(fileHandler)

        return newLgr

    def generateInquisitionDbConnection(self, dbUser, dbPass, dbName, dbHost='127.0.0.1', dbPort=3306):
        """
        Generate main Inquisition database connection handler

        :param dbUser: username of db account
        :param dbPass: password of db account
        :param dbName: name of database to connect to
        :param dbHost: (Opt.) database host to connect to (default: 127.0.0.1)
        :param dbPort: (Opt.) port to use when connecting to database host (default: 3306)
        :return: PyMySQL connection obj
        """

        return pymysql.connect(host=dbHost, port=dbPort, user=dbUser, password=dbPass, db=dbName,
                               charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)

    def fetchParsers(self):
        """
        Fetch parsing data from inquisition database
        
        :return: dict
        """

        parsers = {}

        # fetch parsers from DB
        sql = "SELECT " \
              " parser_id, " \
              " parser_name, " \
              " parser_log " \
              "FROM " \
              " Parsers " \
              "WHERE " \
              " status = 1"

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql)

            # fetch results
            dbResults = dbCursor.fetchall()
            for row in dbResults:
                # add each parser to parser store
                parsers[row['parser_id']] = Parser(lgr=self.lgr, inquisitionDbHandle=self.inquisitionDbHandle,
                                                   logDbHandle=self.logDbHandle, logTTL=self.cfg['parsing']['logTTL'],
                                                   maxLogsToProcess=self.cfg.getint('parsing', 'maxLogsToParse'),
                                                   parserID=row['parser_id'], parserName=row['parser_name'],
                                                   logFile=row['parser_log'],
                                                   keepPersistentStats=self.cfg.getboolean('stats', 'keepPersistentStats'),
                                                   metricsMode=self.cfg.getboolean('logging', 'enableMetricsMode'))

        return parsers

    def startAnatomizer(self):
        """
        Begin cycle of polling of each Parser
        
        :return: void 
        """

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
            # fork process before beginning read
            self.lgr.debug('forking off parser [ ' + str(parserId) + ' - ' + self.parserStore[parserId].parserName
                           + ' ] to child process')
            newParserPID = fork()
            if newParserPID == 0:
                # in child process, start parsing
                numRuns = 0
                while True:
                    sleepTime = int(self.cfg['parsing']['sleepTime'])
                    numRunsBetweenStats = int(self.cfg['parsing']['numSleepsBetweenPolls'])

                    # poll for new logs
                    self.parserStore[parserId].pollLogFile(testRun, useHazyStateTracking=hazyStateTrackingStatus,
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

        self.lgr.info('all templates loaded and parsers started [ SUCCESSFULLY')

