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
from pymysql import err,OperationalError

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
    nodeTypes = ('src', 'dst')
    fieldTypeKeyToIDCache = {}
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

        self.initTrafficNodeAnalysisCalculations()

    def fetchKnownHostData(self):
        """
        Fetches known host records from inquisition DB

        :return: dict
        """

        hosts = ()

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

            dbCursor.close()

        return hosts

    def getFieldNameFromType(self, fieldType='log_host'):
        """
        Get name of field to use based on type ID

        :param fieldType: type of field to fetch the name of
        :return: str
        """

        hostFieldName = ''

        # define sql
        sql = """
                SELECT 
                    F.field_name 
                FROM 
                    Fields F
                JOIN 
                    FieldTypes FT 
                ON 
                    (F.field_type=FT.type_id) 
                WHERE 
                    FT.type_name = %s
                LIMIT 1
            """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql, fieldType)

            # fetch results
            dbResults = dbCursor.fetchone()
            if dbResults:
                try:
                    hostFieldName = dbResults['field_name']
                except KeyError as e:
                    self.lgr.warn(
                        'results returned, but field name value not found (see Issue #65 on GitHub) :: [ MSG: '
                        + str(e) + ' ]')

            dbCursor.close()

        return hostFieldName

    def getFieldTypeIDFromTypeKey(self, typeKey='hst'):
        """
        Get type ID of field type with given type key

        :param typeKey: type key to find field type ID of
        :return: int
        """

        fieldTypeID = None

        # define sql
        sql = """
                SELECT 
                    type_id 
                FROM 
                    FieldTypes  
                WHERE 
                    type_key = %s
                LIMIT 1
            """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql, typeKey)

            # fetch results
            dbResults = dbCursor.fetchone()
            if dbResults:
                fieldTypeID = dbResults['type_id']

            dbCursor.close()

        return fieldTypeID

    def identifyUnknownHosts(self, hostFieldName):
        """
        Searches raw logs for hosts not in host store

        :param hostFieldName: string to use as key/field name to identify host val
        :return: list (unknown host data), list (host list)
        """

        hostCache = []
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
                    if logHost not in self.hostStore and logHost not in hostCache:
                        # unknown host, add to unknown host list and host list cache
                        hostData = {
                            'host': logHost,
                            'logIndex': logIdx
                        }

                        unknownHosts.append(hostData)
                        hostCache.append(logHost)
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
                for hostObj in hostData:
                    try:
                        host = hostObj['host']

                        dbCursor.execute(sql, host)
                        self.inquisitionDbHandle.commit()

                        if self.getCfgValue(section='logging', name='verbose', defaultVal=False, dataType=bool):
                            self.lgr.debug('synced new unknown host [ ' + host + ' ] to inquisition DB')
                    except err as e:
                        self.inquisitionDbHandle.rollback()
                        self.lgr.critical('database error when inserting known host into Inquisition database while ' +
                                          'in baseline mode :: [ ' + str(e) + ' ]')

                dbCursor.close()

                self.lgr.debug('added [ ' + str(len(hostData)) + ' ] new hosts to known hosts table in Inquisition database')

    def performUnknownHostAnalysis(self):
        """
        Perform analysis that runs checks for unknown hosts that are generating logs

        :return: void
        """

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
        hostField = self.getFieldNameFromType(fieldType='log_source')
        if not hostField:
            self.lgr.warn('no host field specified, not able to perform host-anomaly detection')
        else:
            self.lgr.debug('using [ ' + hostField + ' ] as host-identifying field name')

            self.lgr.info('beginning unknown host identification')
            unknownHosts = self.identifyUnknownHosts(hostField)
            self.lgr.info(
                'host identification complete: [ ' + str(len(unknownHosts)) + ' ] unknown hosts identified')

            # check if any unknown hosts were found
            if 0 < len(unknownHosts):
                # generate alerts if not in baseline mode
                if not self.getCfgValue(section='learning', name='enableBaselineMode', defaultVal=False, dataType=bool):
                    # not in baseline mode, generate alert(s)
                    for hostData in unknownHosts:
                        self.alertNode.addAlert(timestamp=int(time()), alertType=1, host=hostData['host'],
                                                alertDetails='Host anomaly detected!',
                                                logData=self.logStore[hostData['logIndex']])

                # add unknown hosts from host list to db
                self.addUnknownHostData(unknownHosts)
                self.lgr.debug('unknown hosts now identified as known and added to database')

    def initTrafficNodeAnalysisCalculations(self):
        """
        Resets all class variables for traffic analysis calculations

        :return: void
        """

        for nodeType in self.nodeTypes:
            # initialize dict with node type as key for multiple node-related class vars
            self.nodeCounts[nodeType] = {}
            self.nodeOPSResults[nodeType] = {}
            self.prevNodeOPSResults[nodeType] = {}

    def calculateNodeOccurrenceCounts(self, nodeFieldName, nodeFieldType):
        """
        Calculates the total number of occurrences we see each individual node of given type and name in the raw log store

        :param nodeFieldName: key name to use for identifying field val in log record dicts
        :param nodeFieldType: field value type to search for ('src' or 'dst')
        :return: void
        """

        nodeFieldType = nodeFieldType.lower()

        if not nodeFieldName:
            raise ValueError('node field name not specified for OCC calculations')
        if nodeFieldType not in self.nodeTypes:
            raise ValueError('invalid node field type specified for traffic node OCC calculation')

        for logIdx in self.logStore:
            # see if field name is present
            try:
                nodeFieldVal = self.logStore[logIdx][nodeFieldName]

                # update log counts for val
                if nodeFieldVal in self.nodeCounts[nodeFieldType]:
                    # previous entries already found, increase count
                    self.nodeCounts[nodeFieldType][nodeFieldVal]['count'] += 1
                else:
                    # first occurrence found, initialize data set for node
                    self.nodeCounts[nodeFieldType][nodeFieldVal] = {
                        'count': 1
                    }

                # add example log for node (to be used later for possible alerts)
                # we always want the latest log, so this will always get set if a value for the nodeFiledName is set
                self.nodeCounts[nodeFieldType][nodeFieldVal]['logIdx'] = logIdx
            except KeyError:
                # log doesn't have anything set for field name, continue on
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

        timeValString = '[ START: { ' + str(self.runStartTime) + ' } // END: { ' + str(self.runEndTime) + ' } ]'

        if self.runStartTime < 1 or self.runEndTime < 1:
            raise ValueError('invalid start or end time set :: ' + timeValString)

        # calculate elapsed time in seconds and validate it
        elapsedTime = self.runEndTime - self.runStartTime
        if elapsedTime <= 0:
            raise ValueError('end time is the same or before start time; could not calculate occurrences per second for'
                             + ' node :: ' + timeValString)

        # calculate occ/sec
        occurrencesPerSec = float(occurrenceCount / elapsedTime)

        return occurrencesPerSec

    def calculateOPSResultsForNodeSet(self, nodeSetType):
        """
        Calculate OPS for all nodes in given set type

        :param nodeSetType: which set of nodes to perform calculations on (src|dst)
        :return: void
        """

        # validate node set type
        nodeSetType = nodeSetType.lower()
        if nodeSetType not in self.nodeTypes:
            raise ValueError('invalid node set type provided')

        for node in self.nodeCounts[nodeSetType]:
            occPerSec = self.calculateOPSForNode(self.nodeCounts[nodeSetType][node]['count'])

            # add OPS to result set
            self.nodeOPSResults[nodeSetType][node] = {
                'logIdx': self.nodeCounts[nodeSetType][node]['logIdx'],
                'ops': occPerSec
            }

            if self.getCfgValue(section='logging', name='verbose', defaultVal=False, dataType=bool):
                self.lgr.debug(
                    'calculated occurrences of node [ ' + str(node) + ' // TYPE: ' + nodeSetType + ' ] to be [ '
                    + str(occPerSec) + ' / sec ]')

    def fetchNodeOPSRecordInDB(self):
        """
        Fetch all node OPS results that were previously collected from the inquisition DB

        :return: void
        """


        # define sql
        sql = """
                SELECT 
                    type_key,
                    node_val,
                    occ_per_sec 
                FROM 
                    TrafficNodeStats TNS 
                JOIN 
                    FieldTypes FT
                ON 
                   (TNS.field_type_id=FT.type_id)
            """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql)

            # fetch results
            dbResults = dbCursor.fetchall()
            if dbResults:
                self.lgr.debug('fetched [ ' + str(len(dbResults)) + ' ] previously-calculated OPS results from db' )
                for result in dbResults:
                    if result['type_key']:
                        self.prevNodeOPSResults[result['type_key']][result['node_val']] = {
                            'ops': result['occ_per_sec']
                        }

                    if self.getCfgValue(section='logging', name='verbose', defaultVal=False, dataType=bool):
                        self.lgr.debug('fetched past OPS result from db :: [ NODE: ' + result['node_val'] + ' // TYPE: '
                                       + result['type_key'] + ' // OPS: ' + str(result['occ_per_sec']))

            dbCursor.close()

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
            maxStdDev = self.getCfgValue('alerting', 'maxTrafficNodeStdDev', defaultVal=1.0, dataType=float)
        except KeyError:
            # config not set, use default
            maxStdDev = 1.0

        # calculate std deviation
        standardDeviation = stdev([prevNodeTrafficResult, currentNodeTrafficResult])
        if self.getCfgValue(section='logging', name='verbose', defaultVal=False, dataType=bool):
            self.lgr.debug('calculated std dev for [ NODE: ' + str(node) + ' // TYPE ID: ' + str(nodeType) + ' ] as [ '
                           + str(standardDeviation) + ' ] w/ max std dev set to [ ' + str(maxStdDev) + ' ]')

        if maxStdDev < standardDeviation:
            return standardDeviation

        return 0

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
                    # node was previously found, compare values by checking std deviation
                    prevOPSResult = self.prevNodeOPSResults[nodeType][node]['ops']
                    currentOPSResult = self.nodeOPSResults[nodeType][node]['ops']

                    stdDev = self.determineOPSStdDevSignificance(node=node, nodeType=nodeType,
                                                                 prevNodeTrafficResult=prevOPSResult,
                                                                 currentNodeTrafficResult=currentOPSResult)
                    if 0 < stdDev:
                        # raise anomaly alert
                        logData = self.logStore[self.nodeOPSResults[nodeType][node]['logIdx']]

                        # set default src and dst node, then set correct one to node val depending on node type
                        srcNode = '0.0.0.0'
                        dstNode = '0.0.0.0'
                        if nodeType == 'src':
                            srcNode = node
                        else:
                            dstNode = node

                        # set alert details
                        alertDetails = 'Detected significant change in OPS for traffic node :: [ NODE: ' + node \
                                       + ' // TYPE: ' + nodeType + ' // { ' + str(prevOPSResult) + ' -> ' \
                                       + str(currentOPSResult) + ' } // STD DEV: { ' + str(stdDev) + ' } ]'

                        # nodes and alert metadata set, add alert if required
                        if not self.getCfgValue(section='learning', name='enableBaselineMode', defaultVal=False,
                                                dataType=bool):
                            self.alertNode.addAlert(timestamp=int(time()), alertType=2, srcNode=srcNode, dstNode=dstNode,
                                                alertDetails=alertDetails, logData=logData)

    def updateNodeOPSRecordInDB(self, nodeVal, nodeType):
        """
        Update record with given node value and field type with OPS val

        :param nodeVal: node value of record to update, e.g. IP or hostname
        :param nodeType: type of field this node is
        :return: bool
        """

        verboseLogging = self.getCfgValue(section='logging', name='verbose', defaultVal=False, dataType=bool)
        status = False

        if not nodeVal or not nodeType:
            raise ValueError('missing node data :: [ NODE: ' + nodeVal + ' // FT: ' + nodeType + ' ]')

        # get OPS results
        try:
            ops = self.nodeOPSResults[nodeType][nodeVal]['ops']
        except KeyError:
            # node OPS data is missing, nothing to insert into db
            return status

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

        # check if we've already matched the key to a field type ID
        if nodeType in self.fieldTypeKeyToIDCache:
            fieldTypeID = self.fieldTypeKeyToIDCache[nodeType]['id']
        else:
            # convert field ID from given node type
            fieldTypeID = self.getFieldTypeIDFromTypeKey(nodeType)

            # add to mapping cache
            if verboseLogging:
                self.lgr.debug('adding field type ID to field type key to ID cache :: [ KEY: ' + nodeType
                               + ' // TYPE ID: ' + str(fieldTypeID) + ' ]')
            self.fieldTypeKeyToIDCache[nodeType] = {
                'id': fieldTypeID
            }

        if fieldTypeID:
            # try inserting/updating in db
            with self.inquisitionDbHandle.cursor() as dbCursor:
                nodeString = '[ ' + str(nodeVal) + ' // TYPE ID: ' + str(fieldTypeID) + ' ]'

                try:
                    dbCursor.execute(sql, (nodeVal, fieldTypeID, ops))
                    self.inquisitionDbHandle.commit()
                    if verboseLogging:
                        self.lgr.debug(
                            'successfully synced node ' + nodeString + ' to traffic node tracking table in Inquisition database')

                    status = True
                except err as e:
                    self.lgr.critical(
                        'database error when syncing data for ' + nodeString + ' :: [ ' + str(e) + ' ]')
                    self.inquisitionDbHandle.rollback()
                finally:
                    dbCursor.close()
        else:
            self.lgr.debug('field type ID not found for field type key :: [ KEY: ' + nodeType + ' ]')

        return status

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
                    if not self.updateNodeOPSRecordInDB(nodeVal=node, nodeType=nodeType):
                        self.lgr.critical('unable to sync node OPS data to inquisition DB :: [ NODE: ' + str(node)
                                          + ' // TYPE ID: ' + str(nodeType)
                                          + ' // OPS: ' + str(self.nodeOPSResults[nodeType][node]['ops']) + ' ]')

            numNodeOPSResults = 0
            for nodeType in self.nodeTypes:
                numNodeOPSResults += len(self.nodeOPSResults[nodeType])

            self.lgr.info('synced traffic node stats for [ ' + str(numNodeOPSResults) + ' ] nodes')

    def performTrafficNodeAnalysis(self):
        """
        Perform analysis on network traffic related nodes, e.g. source and destination IPs/hostnames

        :return: void
        """

        self.lgr.info('starting traffic node analysis')

        # get field names associated with each field type
        try:
            srcNodeFieldName = self.getFieldNameFromType(fieldType='traffic_source')
            dstNodeFieldName = self.getFieldNameFromType(fieldType='traffic_destination')
            self.lgr.debug('using [ ' + str(srcNodeFieldName) + ' ] field as source traffic node field name and [ '
                           + str(dstNodeFieldName) + ' ] field as destination traffic node field name')
        except KeyError as e:
            self.lgr.warning('problem while trying to identify field names, skipping traffic analysis  :: [ ' + str(e)
                             + ' ]')
            return

        self.initTrafficNodeAnalysisCalculations()

        # get counts for src and dst node fields in raw logs in log store
        # check for raw logs
        if self.logStore:
            # raw logs present, initialize occurrence count calculations for all indiv. nodes for each node type
            self.calculateNodeOccurrenceCounts(nodeFieldName=srcNodeFieldName, nodeFieldType='src')
            self.calculateNodeOccurrenceCounts(nodeFieldName=dstNodeFieldName, nodeFieldType='dst')

            # take previously calculated OCCs and calculate OPS of each node set type
            for nodeType in self.nodeTypes:
                self.lgr.info('calculating OPS for [ ' + nodeType + ' ] node set')
                self.calculateOPSResultsForNodeSet(nodeType)

            # read in OPS results from db that were calculated on previous runs
            self.lgr.info('fetching previously-calculated OPS results from Inquisition database')
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
        Starts anomaly detection engine and its components

        :return: void
        """

        self.runStartTime = time()
        analysisHasRan = False

        # check if this is a test run
        testRun = self.getCfgValue(section='cli', name='test_run', defaultVal=False, dataType=bool)

        newAnalyzerPID = 0
        if not testRun:
            # fork process before beginning analysis
            self.lgr.debug('forking off host and traffic anomaly detection engine to child process')
            newAnalyzerPID = fork()

        if newAnalyzerPID == 0 or testRun:
            # in child process, bounce inquisition DB handle (see issue #66)
            try:
                self.bounceInquisitionDbConnection()
            except OperationalError as e:
                self.lgr.critical('could not create database connection :: [ ' + str(e) + ' ]')
                if self.sentryClient:
                    self.sentryClient.captureException()

                exit(1)

            # run analysis after every $sleepTime seconds
            sleepTime = self.getCfgValue(section='learning', name='anomalyDetectionSleepTime', defaultVal=15,
                                         dataType=int)

            while True:
                # fetch raw logs
                self.lgr.info('fetching raw logs for anomaly detection')
                # get baseline logs if in baseline mode, raw if not
                logType = 'raw'
                if self.getCfgValue(section='learning', name='enableBaselineMode', defaultVal=False, dataType=bool):
                    logType = 'baseline'
                self.logStore = self.fetchLogData(logType=logType)

                # set end time and cached start time right after logs are read in so no time is missed (we use this later)
                self.runEndTime = time()
                cachedStartTime = time()

                if self.logStore:
                    # raw logs available
                    # start unknown host analysis
                    self.performUnknownHostAnalysis()

                    # start traffic node analysis
                    # only run analysis if we have logs and have ran an analysis before
                    # we get bad results on the first run, see Issue #54
                    if analysisHasRan:
                        self.performTrafficNodeAnalysis()
                    else:
                        self.lgr.debug('skipping traffic node analysis since this is the first run (see Issue #54)')
                else:
                    self.lgr.info('no raw logs to perform host anomaly detection on - sleeping...')

                # check if running a test run
                if testRun:
                    self.lgr.debug('test run, exiting erudite loop')
                    break

                # update orig start time with cached start time now that we're done with the orig time
                self.runStartTime = cachedStartTime

                analysisHasRan = True

                # sleep for determined time
                self.lgr.debug('anomaly detection engine is sleeping for [ ' + str(sleepTime)
                               + ' ] seconds before restarting routines')
                sleep(sleepTime)

