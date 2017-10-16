#!/usr/bin/python3

"""

APP: Inquisition
DESC: Library used for anomaly detection in parsed logs
CREATION_DATE: 2017-09-02

"""

# MODULES
# | Native
from os import fork
from time import sleep

# | Third-Party

# | Custom
from lib.destiny.Destiny import Destiny

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class Erudite(Destiny):
    """
    An elegant and low-friction Log anomaly detection engine
    """

    hostStore = []
    logStore = {}


    def __init__(self, cfg, sentryClient=None):
        Destiny.__init__(self, cfg, lgrName=__name__, sentryClient=sentryClient)


    def fetchKnownHostData(self):
        """
        Fetches known host records from inquisition DB and inserts them into the local host store

        :return: dict
        """

        # define sql
        sql = """
                SELECT 
                    host_val 
                FROM 
                    KnownHosts
              """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql)

            # fetch results
            hosts = dbCursor.fetchall()

        return hosts


    def getHostFieldName(self):
        """
        Get name of field to use as host value

        :return: str
        """

        hostFieldName = ''

        # define sql
        sql = """
                SELECT 
                    field_name 
                FROM 
                    Fields 
                WHERE 
                    is_host_field = 1
                LIMIT 1
            """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql)

            # fetch results
            dbResults = dbCursor.fetchone()
            if dbResults:
                hostFieldName = dbResults['field_name']

        return hostFieldName


    def identifyUnknownHosts(self, hostFieldName):
        """
        Searches raw logs for hosts not in host store

        :param hostFieldName: string to use as key/field name to identify host val
        :return: list
        """

        unknownHosts = []

        if not hostFieldName:
            raise ValueError('no host field name provided')

        # traverse through raw logs
        if self.logStore:
            # raw logs present, start traversal
            self.lgr.debug('searching log store for any unknown hosts')
            for logIdx in self.logStore:
                try:
                    logHost = self.logStore[logIdx][hostFieldName]

                    # check if log host is already in host store OR if we've already added it to the unknown hosts list
                    if logHost not in self.hostStore and logHost not in unknownHosts:
                        # unknown host, add to list
                        unknownHosts.append(logHost)
                except KeyError:
                    # log doesn't have anything set for host field, skip it
                    continue

        return unknownHosts


    def addUnknownHostData(self, hostData):
        """
        Add host value(s) of unknown hosts to Inquisition DB

        :param hostData: host-identification values (hostname/IP/other identifier)
        :return: void
        """

        if hostData:
            # new unknown hosts sent, add them to db

            sql = """
                    INSERT INTO
                        KnownHosts
                        (host_val)
                    VALUES
                        (%s)
            """

            with self.inquisitionDbHandle.cursor() as dbCursor:
                try:
                    dbCursor.executemany(sql, hostData)
                    self.inquisitionDbHandle.commit()
                    self.lgr.debug('added [ ' + str(len(hostData)) + ' ] new hosts to known hosts table in Inquisition database')
                except Exception as e:
                    self.lgr.critical('unable to insert known host into Inquisition database while in baseline mode :: [ ' + str(e) + ' ]')
                    self.inquisitionDbHandle.rollback()


    def startAnomalyDetectionEngine(self):
        """
        Starts anomaly detection engine

        :return: void
        """

        # fork process before beginning analysis
        self.lgr.debug('forking off anomaly detection engine to child process')
        newTrainerPID = fork()
        if newTrainerPID == 0:
            # in child process, start analyzing
            # run analysis after every $sleepTime seconds
            sleepTime = int(self.cfg['learning']['anomalyDetectionSleepTime'])

            while True:
                # read in list of already known hosts
                # clear current master host list
                self.hostStore = []

                # fetch fresh host list from inquisition DB
                self.lgr.info('fetching list of already known hosts')
                knownHostStore = self.fetchKnownHostData()
                # traverse through list of host records to add raw host_val entries to master host list
                for hostEntry in knownHostStore:
                    try:
                        self.hostStore.append(hostEntry['host_val'])
                    except KeyError as e:
                        self.lgr.warn('host entry found with no host value set (see Issue #47 on GitHub) :: [ MSG: ' + str(e) + ' ]')

                # read through log entries for new hosts
                # get host field
                hostField = self.getHostFieldName()
                if not hostField:
                    self.lgr.warn('no host field specified, not able to perform host-anomaly detection')
                else:
                    self.lgr.debug('using [ ' + hostField + ' ] as host-identifying field name')

                    # fetch raw logs
                    self.lgr.info('fetching raw logs for anomaly detection')

                    # get baseline logs if in baseline mode, raw if not
                    logType = 'raw'
                    if self.cfg.getboolean('learning', 'enableBaselineMode'):
                        logType = 'baseline'
                    self.logStore = self.fetchLogData(logType=logType)

                    if self.logStore:
                        # raw logs available; search them for unknown hosts
                        self.lgr.debug('beginning unknown host identification')
                        unknownHosts = self.identifyUnknownHosts(hostField)
                        self.lgr.info('host identification complete - [ ' + str(len(unknownHosts)) + ' ] unknown hosts identified')

                        # preserve hosts if in baseline mode
                        if self.cfg.getboolean('learning', 'enableBaselineMode'):
                            # in baseline mode, add unknown hosts
                            self.lgr.debug('in baseline mode - unknown hosts now identified as known and added to database')
                            self.addUnknownHostData(unknownHosts)
                    else:
                        self.lgr.info('no raw logs to perform host anomaly detection on - sleeping...')

                # sleep for determined time
                self.lgr.debug('anomaly detection engine is sleeping for [ ' + str(sleepTime)
                               + ' ] seconds before restarting routines')
                sleep(sleepTime)
