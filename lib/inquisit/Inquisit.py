#!/usr/bin/python3

"""
Inquisit.py

APP: Inquisition
DESC: Parent class containing general functions such as logging and db connectivity
CREATION_DATE: 2017-05-12

"""

# MODULES
# | Native
import logging
import configparser

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
__status__ = 'Development'


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
            self.bounceInquisitionDbConnection()
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
        try:
            logLvl = getattr(logging, cfg['logging']['logLvl'].upper())
        except (configparser.NoSectionError, configparser.NoOptionError, KeyError):
            logLvl = 'INFO'
        newLgr.setLevel(logLvl)

        # check if handlers have already been added to this logger
        if not len(newLgr.handlers):
            # handlers not added yet
            # create file handler for log file
            try:
                logFile = cfg['logging']['logFile']
            except (configparser.NoSectionError, configparser.NoOptionError, KeyError):
                logFile = '/var/log/inquisition/app.log'
            fileHandler = logging.FileHandler(logFile)
            fileHandler.setLevel(logLvl)

            # set output formatter
            try:
                # NOTE: we need to get the logFormat val with the raw flag set in order to avoid logging from interpolating
                logFormat = cfg.get('logging', 'logFormat', raw=True)
            except (configparser.NoSectionError, configparser.NoOptionError, KeyError):
                logFormat = '%(asctime)s inquisition: [ %(levelname)s ] [ %(name)s ] %(message)s'
            frmtr = logging.Formatter(logFormat)
            fileHandler.setFormatter(frmtr)

            # associate file handler w/ logger
            newLgr.addHandler(fileHandler)

        return newLgr

    def getCfgValue(self, section, name, defaultVal, dataType=str):
        """
        Fetch configuration value for specified section/name

        :param section: section to get value from
        :param name: name to get value of
        :param defaultVal: value to set as config val in case one is not found
        :param errorMsg: error message to log if not found
        :param dataType: specifies datatype to cast config value to before returning
        :return: bool, int, or str
        """

        configVal = None

        try:
            if dataType == str:
                configVal = self.cfg[section][name]
            elif dataType == int:
                configVal = self.cfg.getint(section, name)
            elif dataType == bool:
                configVal = self.cfg.getboolean(section, name)
            elif dataType == float:
                configVal = self.cfg.getfloat(section, name)
        except (configparser.NoSectionError, configparser.NoOptionError, KeyError):
            # log error and set default
            self.lgr.debug('config value not found :: [ ' + section + ' / ' + name + ' ] :: using default val [ '
                             + str(defaultVal) + ' ]')
            configVal = defaultVal

        return configVal

    def bounceInquisitionDbConnection(self):
        """
        Reconnects to MySQL for Inquisition DB connection

        :return: bool
        """

        # check if connection already exists
        try:
            if self.inquisitionDbHandle:
                self.inquisitionDbHandle.close()
        except AttributeError:
            # sometimes the above statement does fail properly when inquisitionDbHandle == None
            # this is harmless; see Issue #66
            pass

        # regenerate conn
        self.inquisitionDbHandle = pymysql.connect(host=self.cfg['mysql_database']['db_host'],
                                                   port=int(self.cfg['mysql_database']['db_port']),
                                                   user=self.cfg['mysql_database']['db_user'],
                                                   password=self.cfg['mysql_database']['db_pass'],
                                                   db=self.cfg['mysql_database']['db_name'],
                                                   charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
        if self.inquisitionDbHandle:
            self.lgr.debug('database connection established [ SUCCESSFULLY ] for main inquisition database :: [ '
                           + self.cfg['mysql_database']['db_host'] + ':' + self.cfg['mysql_database']['db_port'] + ' ]')

            return True
        else:
            return False