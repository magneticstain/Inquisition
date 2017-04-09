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

# | Third-Party
import pymysql

# | Custom


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
    dbHandle = None
    parserStore = {}

    def __init__(self, cfg):
        self.cfg = cfg

        # start logger
        self.lgr = self.generateLogger()

        # create db connection
        try:
            self.dbHandle = self.generateDbConnection(cfg['mysql_database']['db_user'],
                                                      cfg['mysql_database']['db_pass'],
                                                      cfg['mysql_database']['db_name'],
                                                      cfg['mysql_database']['db_host'],
                                                      int(cfg['mysql_database']['db_port']))

        except pymysql.OperationalError as e:
            self.lgr.critical('could not create database connection :: [ ' + str(e) + ' ]')

    def generateLogger(self):
        """
        Generate logging handler with given info
        
        :return: logger 
        """

        # initialize logger
        newLgr = logging.getLogger(__name__)

        # set logging level
        logLvl = getattr(logging, self.cfg['application_logs']['logLvl'].upper())
        newLgr.setLevel(logLvl)

        # create file handler for log file
        fileHandler = logging.FileHandler(self.cfg['application_logs']['logFile'])
        fileHandler.setLevel(logLvl)

        # set output formatter
        # NOTE: we need to get the logFormat val with the raw flag set in order to avoid logging from interpolating
        frmtr = logging.Formatter(self.cfg.get('application_logs', 'logFormat', raw=True))
        fileHandler.setFormatter(frmtr)

        # associate file handler w/ logger
        newLgr.addHandler(fileHandler)

        return newLgr


    def generateDbConnection(self, dbUser, dbPass, dbName, dbHost='127.0.0.1', dbPort=3306):
        """
        Generate PyMySQL database connection handler

        :param dbUser: username of db account
        :param dbPass: password of db account
        :param dbName: name of database to connect to
        :param dbHost: (Opt.) database host to connect to (default: 127.0.0.1)
        :param dbPort: (Opt.) port to use when connecting to database host (default: 3306)
        :return: PyMySQL connection obj
        """

        return pymysql.connect(host=dbHost, port=dbPort, user=dbUser, password=dbPass, db=dbName,
                               charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)

    def loadParsers(self):
        """
        Load parsing data from database and add to parser store
        
        :return: void
        """




