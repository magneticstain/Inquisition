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
from statistics import stdev

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
    fieldTypes = {}
    nodeCounts = {}
    nodeOPSResults = {}
    prevNodeOPSResults = {}
    alertNode = None
    runStartTime = 0
    runEndTime = 0


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
                    self.alertNode.addAlert(timestamp=int(time()), alertType=0, alertDetails='Host anomaly detected!')


    def fetchFieldTypes(self):
        """
        Read in field types and their IDs to class var from DB

        :return: void
        """

        # define sql
        sql = """
                SELECT 
                    type_id,
                    type_name 
                FROM 
                    FieldTypes
                WHERE
                    type_id > 1
            """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql)

            # fetch results
            dbResults = dbCursor.fetchall()
            if dbResults:
                # parse results
                for result in dbResults:
                    self.fieldTypes[result['type_id']] = result['type_name']


    def calculateNodeOccurrenceCounts(self, srcNodeFieldName, dstNodeFieldName):
        """
        Calculates the total number of occurrences we see each individual node in the raw log store

        :param srcNodeFieldName: field name to use for identifying source field val
        :param dstNodeFieldName: field name to use for identifying destination field val
        :return: void
        """

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
                    # first occurrence found, set to 1
                    self.nodeCounts['dst'][dstNodeFieldVal] = 1
            except KeyError:
                # log doesn't have anything set for dst field, continue onto next log
                pass


    def calculateOPSForNode(self, occurrenceCount):
        """
        Calculates occurrences per second for node with given OCC by comparing OCC with elapsed time

        :param occurrenceCount: number of occurrences we saw node value in given timeframe
        :return: float
        """

        if occurrenceCount <= 0:
            # no occurrences seen, we can just return 0 w/o doing anything else
            return 0

        if self.runStartTime < 1 or self.runEndTime < 1:
            raise ValueError('invalid start or end time provided :: [ START: { ' + str(self.runStartTime) + ' } // END: { ' + str(self.runEndTime) + ' } ]')

        # calculate elapsed time in seconds and validate it
        elapsedTime = float(self.runEndTime) - float(self.runStartTime)
        if elapsedTime <= 0:
            raise ValueError('end time is the same or before start time, could not calculate occurrences per second for node')

        # calculate occ/sec
        occurrencesPerSec = float(occurrenceCount / elapsedTime)

        return occurrencesPerSec


    def calculateOPSForNodeSet(self, nodeSetType):
        """
        Calculate OPS for all nodes in given set type

        :param nodeSetType: which set of nodes to perform calculations on (src|dst)
        :return: void
        """

        # validate node set type
        nodeSetType = nodeSetType.lower()
        if nodeSetType != 'src' and nodeSetType != 'dst':
            raise ValueError('invalid node set type provided')

        for node in self.nodeCounts[nodeSetType]:
            occPerSec = self.calculateOPSForNode(self.nodeCounts[nodeSetType][node])

            # add OPS to result set
            self.nodeOPSResults[nodeSetType][node] = {
                'ops': occPerSec
            }

            if self.cfg.getboolean('logging', 'verbose'):
                self.lgr.debug(
                    'calculated occurrences of node [ ' + str(node) + ' // TYPE: ' + nodeSetType + ' ] to be [ '
                    + str(occPerSec) + ' / sec ]')


    def updateNodeOPSRecordInDB(self, nodeVal, fieldType, ops):
        """
        Update record with given node value and field type with OPS val

        :param nodeVal: node value of record to update, e.g. IP or hostname
        :param fieldType: ID of field type this val came from; src = 1, dst = 2
        :param ops: occurrences per second that we're seeing given node val
        :return: bool
        """

        # set sql
        sql = """
                INSERT INTO 
                    TrafficNodeStats 
                    (
                        node_val, 
                        field_type_id, 
                        occ_per_sec
                    ) 
                VALUES 
                    (
                        %s, 
                        %s, 
                        %s
                    ) 
                ON DUPLICATE KEY UPDATE  
                    occ_per_sec=VALUES(occ_per_sec)
        """

        # convert field type to field ID
        fieldType = fieldType.lower()
        if fieldType == 'src':
            fieldTypeID = 2
        else:
            fieldTypeID = 3

        # try inserting/updating in db
        with self.inquisitionDbHandle.cursor() as dbCursor:
            nodeString = '[ ' + str(nodeVal) + ' // TYPE ID: ' + str(fieldTypeID) + ' ]'

            try:
                dbCursor.execute(sql, (nodeVal, fieldTypeID, ops))
                self.inquisitionDbHandle.commit()
                if self.cfg.getboolean('logging', 'verbose'):
                    self.lgr.debug(
                        'successfully synced node ' + nodeString + ' to traffic node tracking table in Inquisition database')

                return True
            except err as e:
                self.lgr.critical(
                    'database error when syncing data for ' + nodeString + ' :: [ ' + str(
                        e) + ' ]')
                self.inquisitionDbHandle.rollback()

                return False


    def syncOPSResultsToDB(self):
        """
        Traverse through set of OPS results for each node and update associated entry in db with value

        :return:
        """

        # check if OPS results are present
        if self.nodeOPSResults:
            # traverse results and update each in db
            self.lgr.debug('beginning update of traffic node OPS results in DB')
            for nodeType in self.nodeOPSResults:
                for node in self.nodeOPSResults[nodeType]:
                    # send to db
                    if not self.updateNodeOPSRecordInDB(nodeVal=node, fieldType=nodeType,
                                                        ops=self.nodeOPSResults[nodeType][node]['ops']):
                        self.lgr.critical('unable to sync node OPS data to inquisition DB :: [ NODE: ' + str(node)
                                          + ' // TYPE ID: ' + str(nodeType)
                                          + ' // OPS: ' + str(self.nodeOPSResults[nodeType][node]['ops']) + ' ]')


    def fetchNodeOPSRecordInDB(self):
        """
        Fetch all node OPS results that were previously collected from the inquisition DB

        :return: void
        """


        # define sql
        sql = """
                SELECT 
                    node_val,
                    field_type_id,
                    occ_per_sec 
                FROM 
                    TrafficNodeStats
            """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql)

            # fetch results
            dbResults = dbCursor.fetchall()
            if dbResults:
                # refactor results to match current result set
                for result in dbResults:
                    # translate field type ID to field type key
                    if result['field_type_id'] == 2:
                        fieldType = 'src'
                    else:
                        fieldType = 'dst'

                    self.prevNodeOPSResults[fieldType][result['node_val']] = {
                        'ops': result['occ_per_sec']
                    }


    def determineOPSStdDevSignificance(self, node, nodeType, prevNodeTrafficResult, currentNodeTrafficResult):
        """
        Calculates the standard deviation of prev and current node traffic results and determine if it's significant

        :param node: node value that we're making calculations on
        :param nodeType: type of node we're performing calc on
        :param prevNodeTrafficResult: the previous OPS result calculated from the last run
        :param currentNodeTrafficResult: the OPS results for node calculated from current run
        :return: bool
        """

        if prevNodeTrafficResult < 0 or currentNodeTrafficResult < 0:
            raise ValueError('invalid previous or current node traffic results provided')

        # check if std dev was set
        try:
            maxStdDev = self.cfg.getfloat('alerting', 'maxTrafficNodeStdDev')
        except KeyError:
            # config not set, use default
            maxStdDev = 1.0

        # calculate std deviation
        standardDeviation = stdev([prevNodeTrafficResult, currentNodeTrafficResult])
        if self.cfg.getboolean('logging', 'verbose'):
            self.lgr.debug('calculated std dev for [ NODE: ' + str(node) + ' // TYPE ID: ' + str(nodeType) + ' ] as [ '
                           + str(standardDeviation) + ' ] w/ max std dev set to [ ' + str(maxStdDev) + ' ]')

        if maxStdDev < standardDeviation:
            return True

        return False


    def analyzeOPSResultsForAnomalies(self):
        """
        Performs analysis on OPS results by comparing previous OPS results with the results from the latest run

        :return: void
        """

        # traverse current batch of nodes to compare with previous batch
        for nodeType in self.nodeOPSResults:
            for node in self.nodeOPSResults[nodeType]:
                # check if node was found in prev results and is the same type (nodes can have diff src and dst results)
                if node in self.prevNodeOPSResults[nodeType]:
                    if self.cfg.getboolean('logging', 'verbose'):
                        self.lgr.debug('found previous records for node [ ' + node + ' // TYPE: ' + nodeType + ' ]')

                    # node was previously found, compare values by checking std deviation
                    prevOPSResult = self.prevNodeOPSResults[nodeType][node]['ops']
                    currentOPSResult = self.nodeOPSResults[nodeType][node]['ops']

                    if self.determineOPSStdDevSignificance(node=node, nodeType=nodeType,
                                                           prevNodeTrafficResult=prevOPSResult,
                                                           currentNodeTrafficResult=currentOPSResult):
                        # raise anomaly alert
                        # set default src and dst node, then set correct one to node val depending on node type
                        srcNode = '0.0.0.0'
                        dstNode = '0.0.0.0'
                        if nodeType == 'src':
                            srcNode = node
                        else:
                            dstNode = node

                        # set alert details
                        alertDetails = 'detected significant change in OPS for traffic node :: [ ' + str(prevOPSResult) \
                                       + ' -> ' + str(currentOPSResult) + ' ]'

                        # nodes set, add alert
                        self.alertNode.addAlert(timestamp=int(time()), alertType=1, srcNode=srcNode, dstNode=dstNode,
                                                alertDetails=alertDetails)


    def performTrafficNodeAnalysis(self):
        """
        Perform analysis on network traffic related nodes, e.g. source and destination IPs/hostnames

        :return: void
        """

        self.lgr.info('starting traffic node analysis')

        # get field names associated with each field type
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
        self.nodeOPSResults = {
            'src': {},
            'dst': {}
        }
        self.prevNodeOPSResults = {
            'src': {},
            'dst': {}
        }

        # check for raw logs
        if self.logStore:
            # raw logs present, initialize OCC calculations for all indiv. nodes
            self.lgr.debug('searching log store for source and destination traffic nodes')
            self.calculateNodeOccurrenceCounts(srcNodeFieldName=srcNodeFieldName, dstNodeFieldName=dstNodeFieldName)
            # print("NC: " + str(self.nodeCounts))

            # take previously calculated OCCs and calculate OPS of each node set type
            self.lgr.info('calculating OPS for source and destination node sets')
            # src
            self.calculateOPSForNodeSet('src')
            # dst
            self.calculateOPSForNodeSet('dst')

            # read in prev OPS results in db
            self.fetchNodeOPSRecordInDB()

            # run anomaly analysis
            self.lgr.info('performing anomaly analysis on OPS results')
            self.analyzeOPSResultsForAnomalies()

            # update database with OPS results
            self.lgr.info('syncing new traffic node stats to inquisition DB')
            self.syncOPSResultsToDB()

            self.lgr.info('completed traffic node analysis')
        else:
            self.lgr.info('no raw logs available, skipping traffic node analysis')


    def startAnomalyDetectionEngine(self):
        """
        Starts anomaly detection engine

        :return: void
        """

        # set initial start time and initial run flag for use with traffic node analysis
        self.runStartTime = time()

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
                self.runEndTime = time()

                # fetch logs
                self.logStore = self.fetchLogData(logType=logType)

                # set cached start time as right after logs are read in so none are missed (we use this later)
                cachedStartTime = time()

                if self.logStore:
                    # raw logs available
                    # start unknown host analysis
                    self.performUnknownHostAnalysis()

                    # start traffic node analysis
                    self.performTrafficNodeAnalysis()

                    # set cached start time as current start time now that analysis is done and we don't need the old time
                    self.runStartTime = cachedStartTime
                else:
                    self.lgr.info('no raw logs to perform host anomaly detection on - sleeping...')

                # sleep for determined time
                self.lgr.debug('anomaly detection engine is sleeping for [ ' + str(sleepTime)
                               + ' ] seconds before restarting routines')
                sleep(sleepTime)
