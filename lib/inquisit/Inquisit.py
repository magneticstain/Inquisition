#!/usr/bin/python3

"""
Inquisit.py

APP: Inquisition
DESC: 
CREATION_DATE: 2017-05-12

"""

# MODULES
# | Native
import logging

# | Third-Party
import pymysql
import redis

# | Custom

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development|Staging|Production'


class Inquisit:
    """
    Main parent class; includes logic used across other child classes such as db conns, configs, etc
    """

    lgr = None
    cfg = {}
    sentryClient = None
    inquisitionDbHandle = None
    logDbHandle = None

    def __init__(self, cfg, lgrName=__name__, sentryClient=None):
        self.cfg = cfg
        self.sentryClient = sentryClient

        # start logger
        self.lgr = Inquisit.generateLogger(cfg, lgrName)

        self.lgr.debug('initializing Inquisit abstraction layer...')

        # create db handle for log database
        # NOTE: StrictRedis won't actually raise an exception if we can't connect; only when we run queries
        # go figure -_-
        self.logDbHandle = redis.StrictRedis(host=cfg['log_database']['host'], port=cfg['log_database']['port'])
        self.lgr.debug('database connection established for log database :: [ ' + cfg['log_database']['host']
                       + ':' + cfg['log_database']['port'] + ' ]')

        # create connection to inquisition db
        try:
            self.inquisitionDbHandle = Inquisit.generateInquisitionDbConnection(cfg['mysql_database']['db_user'],
                                                                                cfg['mysql_database']['db_pass'],
                                                                                cfg['mysql_database']['db_name'],
                                                                                cfg['mysql_database']['db_host'],
                                                                                int(cfg['mysql_database']['db_port']))
            self.lgr.debug('database connection established for main inquisition database :: [ '
                           + cfg['mysql_database']['db_host'] + ':' + cfg['mysql_database']['db_port'] + ' ]')
            self.lgr.debug('all database connections established [ SUCCESSFULLY ]')
        except pymysql.OperationalError as e:
            self.lgr.critical('could not create database connection :: [ ' + str(e) + ' ]')
            if self.sentryClient:
                self.sentryClient.captureException()

            exit(1)

    @staticmethod
    def generateLogger(cfg, lgrName):
        """
        Generate logging handler with given info

        :param cfg: configuration data needed for logging
        :param lgrName: name used to identify the logger
        :return: logger
        """

        if not cfg or not lgrName:
            raise ValueError('required configuration data not provided :: [ LOGGER NAME: ' + str(lgrName) + ' ]')

        # initialize logger
        newLgr = logging.getLogger(lgrName)

        # set logging level
        logLvl = getattr(logging, cfg['logging']['logLvl'].upper())
        newLgr.setLevel(logLvl)

        # check if handlers have already been added to this logger
        if not len(newLgr.handlers):
            # handlers not added yet
            # create file handler for log file
            fileHandler = logging.FileHandler(cfg['logging']['logFile'])
            fileHandler.setLevel(logLvl)

            # set output formatter
            # NOTE: we need to get the logFormat val with the raw flag set in order to avoid logging from interpolating
            frmtr = logging.Formatter(cfg.get('logging', 'logFormat', raw=True))
            fileHandler.setFormatter(frmtr)

            # associate file handler w/ logger
            newLgr.addHandler(fileHandler)

        return newLgr

    @staticmethod
    def generateInquisitionDbConnection(dbUser, dbPass, dbName, dbHost='127.0.0.1', dbPort=3306):
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