#!/usr/bin/python3

"""

APP: Inquisition
DESC: Library used for anomaly detection in parsed logs
CREATION_DATE: 2017-09-02

"""

# MODULES
# | Native
from os import fork
from time import sleep,time

# | Third-Party
from pymysql import err

# | Custom
from lib.destiny.Destiny import Destiny
from lib.revelation.Revelation import Revelation

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
    An elegant and low-friction log anomaly detection engine
    """

    hostStore = []
    logStore = {}
    nodeCounts = {}
    alertNode = None


    def __init__(self, cfg, sentryClient=None):
        Destiny.__init__(self, cfg, lgrName=__name__, sentryClient=sentryClient)

        # create revalation instance
        self.alertNode = Revelation(cfg, sentryClient=sentryClient)


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


    def getFieldNameFromType(self, typeID):
        """
        Get name of field to use based on type ID

        :return: str
        """

        hostFieldName = ''

        # define sql
        # DEV NOTE: pymysql seems to have some sort of bug where it only validates strings correctly.
        # If we use %d here, execute will fail even if we explicitly cast typeID as an int.
        sql = """
                SELECT 
                    field_name 
                FROM 
                    Fields 
                WHERE 
                    field_type = %s
                LIMIT 1
            """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql, typeID)

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
                except err as e:
                    self.lgr.critical('database error when inserting known host into Inquisition database while in baseline mode :: [ ' + str(e) + ' ]')
                    self.inquisitionDbHandle.rollback()


    def performUnknownHostAnalysis(self):
        """
        Run checks for unknown hosts that are generating logs

        :return: void
        """

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
                self.lgr.warn(
                    'host entry found with no host value set (see Issue #47 on GitHub) :: [ MSG: ' + str(e) + ' ]')

        # read through log entries for new hosts
        # get host field
        hostField = self.getFieldNameFromType(typeID=1)
        if not hostField:
            self.lgr.warn('no host field specified, not able to perform host-anomaly detection')
        else:
            self.lgr.debug('using [ ' + hostField + ' ] as host-identifying field name')

            self.lgr.debug('beginning unknown host identification')
            unknownHosts = self.identifyUnknownHosts(hostField)
            self.lgr.info(
                'host identification complete - [ ' + str(len(unknownHosts)) + ' ] unknown hosts identified')

            # check if any unknown hosts were found
            if 0 < len(unknownHosts):
                # preserve hosts if in baseline mode
                if self.cfg.getboolean('learning', 'enableBaselineMode'):
                    # in baseline mode, add unknown hosts
                    self.lgr.debug('in baseline mode - unknown hosts now identified as known and added to database')
                    self.addUnknownHostData(unknownHosts)
                else:
                    # not in baseline mode, generate alert
                    self.alertNode.addAlert({'place': 'holder'}, timestamp=int(time()), alertType=0, status=0)


    def calculateOccurrencesOfNodePerSecond(self, occurrenceCount, startTime, endTime):
        """
        Calculates occurrences per second by comparing occurrence count with elapsed time

        :param occurrenceCount: number of occurrences we saw node value in given timeframe
        :param startTime: start of run
        :param endTime: end of run
        :return: float
        """

        if startTime < 1 or endTime < 1:
            raise ValueError('invalid start or end time provided :: [ START: { ' + str(startTime) + ' } // END: { ' + str(endTime) + ' } ]')

        if occurrenceCount <= 0:
            # no occurrences seen, we can just return 0 w/o doing anything else
            return 0

        # calculate elapsed time in seconds
        elapsedTime = float(endTime) - float(startTime)
        if elapsedTime <= 0:
            raise ValueError('end time is the same or before start time, could not calculate occurrences per second for node')

        # calcaulte occ/sec
        occurrencesPerSec = float(occurrenceCount / elapsedTime)

        return occurrencesPerSec


    def performTrafficNodeAnalysis(self, startTime, endTime):
        """
        Perform analysis on network traffic related nodes, e.g. source and destination IPs/hostnames

        :param startTime: time - in epoch format - that the last iteration of Erudite started; used for calculating
                            approx. occurrences per second we're seeing for nodes
        :param endTime: epoch timestamp for after logs were fetched from
        :return: void
        """

        # get source and destination field names
        srcNodeFieldName = self.getFieldNameFromType(typeID=2)
        dstNodeFieldName = self.getFieldNameFromType(typeID=3)

        self.lgr.debug('using [ ' + str(srcNodeFieldName) + ' ] field as source traffic node and [ '
                       + str(dstNodeFieldName) + ' ] field as destination traffic node')

        # get counts for src and dst node fields in raw logs in log store
        # reset node counts
        self.nodeCounts = {
            'src': {},
            'dst': {}
        }

        # traverse through raw logs
        if self.logStore:
            # raw logs present, start traversal
            self.lgr.debug('searching log store for source and destination traffic nodes')
            for logIdx in self.logStore:
                # see if source field name is present
                try:
                    srcNodeFieldVal = self.logStore[logIdx][srcNodeFieldName]

                    # update log counts for val
                    if srcNodeFieldVal in self.nodeCounts['src']:
                        # previous entries already found, increase count
                        self.nodeCounts['src'][srcNodeFieldVal] += 1
                    else:
                        # first occurance found, set to 1
                        self.nodeCounts['src'][srcNodeFieldVal] = 1
                except KeyError:
                    # log doesn't have anything set for src field, continue on
                    pass

                # see if destination field name is present
                try:
                    dstNodeFieldVal = self.logStore[logIdx][dstNodeFieldName]

                    # update log counts for val
                    if dstNodeFieldVal in self.nodeCounts['dst']:
                        # previous entries already found, increase count
                        self.nodeCounts['dst'][dstNodeFieldVal] += 1
                    else:
                        # first occurance found, set to 1
                        self.nodeCounts['dst'][dstNodeFieldVal] = 1
                except KeyError:
                    # log doesn't have anything set for dst field, continue onto next log
                    pass

            # get occurrences per second of each node
            # src
            for node in self.nodeCounts['src']:
                occPerSec = self.calculateOccurrencesOfNodePerSecond(self.nodeCounts['src'][node], startTime, endTime)
                self.lgr.debug('calculated occurrences of node [ ' + str(node) + ' ] to be [ ' + str(occPerSec) + ' / sec ]')

            self.lgr.info('completed traffic node analysis')


    def startAnomalyDetectionEngine(self):
        """
        Starts anomaly detection engine

        :return: void
        """

        # set initial start time and initial run flag for use with traffic node analysis
        prevStartTime = time()
        initialRun = True

        # fork process before beginning analysis
        self.lgr.debug('forking off host-anomaly detection engine to child process')
        newTrainerPID = fork()
        if newTrainerPID == 0:
            # in child process, start analyzing

            # run analysis after every $sleepTime seconds
            sleepTime = int(self.cfg['learning']['anomalyDetectionSleepTime'])

            while True:
                # fetch raw logs
                self.lgr.info('fetching raw logs for anomaly detection')

                # get baseline logs if in baseline mode, raw if not
                logType = 'raw'
                if self.cfg.getboolean('learning', 'enableBaselineMode'):
                    logType = 'baseline'

                # record end time before fetching logs
                endTime = time()

                # fetch logs
                self.logStore = self.fetchLogData(logType=logType)

                # set new start time
                startTime = time()

                if self.logStore:
                    # raw logs available
                    # start unknown host analysis
                    self.performUnknownHostAnalysis()

                    # start traffic node analysis
                    self.performTrafficNodeAnalysis(startTime=prevStartTime, endTime=endTime)

                    # set previous start time as current start time now that analysis is done
                    prevStartTime = startTime
                else:
                    self.lgr.info('no raw logs to perform host anomaly detection on - sleeping...')

                # sleep for determined time
                self.lgr.debug('anomaly detection engine is sleeping for [ ' + str(sleepTime)
                               + ' ] seconds before restarting routines')
                sleep(sleepTime)
