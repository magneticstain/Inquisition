#!/usr/bin/python3

"""

APP: Inquisition
DESC: A library for finding network threats from given logs based on learned intel
CREATION_DATE: 2017-09-02

"""

# MODULES
# | Native
from os import fork
from time import sleep,time

# | Third-Party
from pymysql import OperationalError
from sklearn import svm

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


class Sage(Destiny):
    """
    Sage engine for detecting network threats from known threat data
    """

    intelLogStore = {}
    baselineLogStore = {}
    logStore = {}
    networkThreatClassifier = None
    alertNode = None

    def __init__(self, cfg, sentryClient=None):
        Destiny.__init__(self, cfg, lgrName=__name__, sentryClient=sentryClient)

        # create revalation instance
        self.alertNode = Revelation(cfg, sentryClient=sentryClient)

    def initClassifier(self):
        """
        Initialize classifier model for network threat detection

        :return: None
        """

        self.networkThreatClassifier = svm.SVC()

    def gatherAllData(self):
        """
        Fetches raw logs, baseline logs, and intel all at once

        :return: void
        """

        # fetch training data
        self.lgr.info('fetching intel, baseline, and log data (in that order) for threat detection model')
        self.lgr.debug('fetching training intel data')
        self.intelLogStore = self.fetchLogData('intel')
        self.lgr.debug('fetching training baseline data')
        self.baselineLogStore = self.fetchLogData('baseline')

        # refresh log data for testing
        # we need to do this now in order to get the full list of unique fields
        self.lgr.debug('fetching testing (raw log) data')
        self.logStore = self.fetchLogData('raw')

    def processTestingResults(self, results):
        """
        Check results and generate alerts if needed

        :param results: results from running testing data through network threat engine model
        :return: void
        """

        for result in results:
            if result:
                # model detected this as a threat, raise alert
                self.alertNode.addAlert(timestamp=int(time()), alertType=2, alertDetails='Network threat detected!')

    def startNetworkThreatEngine(self):
        """
        Run network threat analysis engine and all needed components

        :return: void
        """

        # check if this is a test run
        try:
            testRun = self.cfg.getboolean('cli', 'test_run')
        except KeyError:
            # test run not defined, set to default of FALSE
            self.lgr.warning('test run flag not set, defaulting to [ FALSE ]')

            testRun = False

        # fork process before beginning analysis
        self.lgr.debug('forking off engine to child process')
        newTrainerPID = fork()
        if newTrainerPID == 0 or testRun:
            # in child process, bounce inquisition DB handle (see issue #66)
            try:
                self.bounceInquisitionDbConnection()
            except OperationalError as e:
                self.lgr.critical('could not create database connection :: [ ' + str(e) + ' ]')
                if self.sentryClient:
                    self.sentryClient.captureException()

                exit(1)

            # create model
            self.lgr.debug('initializing classifier')
            self.initClassifier()

            # train and predict model after every $sleepTime seconds
            sleepTime = int(self.cfg['learning']['networkThreatDetectionSleepTime'])

            while True:
                # fetch all needed data
                self.gatherAllData()

                # model created and data is fetched - let's try to train it
                if not self.intelLogStore:
                    self.lgr.info('no threat intel data available; not able to start training')
                elif not self.baselineLogStore:
                    self.lgr.info('no baseline log data available; not able to start training for threat detection model')
                else:
                    # initialize intel and baseline data
                    self.lgr.debug('initializing intel data')
                    targetFieldName = 'threat'
                    # combine intel and baseline data
                    rawTrainingDataset = {}
                    rawTrainingDataset.update(self.baselineLogStore)
                    rawTrainingDataset.update(self.intelLogStore)

                    # get list of unique fields in both training and testing log sets
                    self.lgr.debug('calculating unique field list for training and testing data initialization')
                    uniqueFieldsForTraining = Destiny.getUniqueLogDataFields(rawTrainingDataset)
                    uniqueFieldsForTesting = Destiny.getUniqueLogDataFields(self.logStore)
                    uniqueFields = list(set(uniqueFieldsForTraining + uniqueFieldsForTesting))

                    trainingData, trainingTargets = self.initializeLogData(rawTrainingDataset, uniqueFields, 'training',
                                                                           targetFieldName)

                    # run model evaluation and print results
                    self.lgr.info('training threat detection model')
                    if self.networkThreatClassifier.fit(trainingData, trainingTargets):
                        self.lgr.info('training complete; starting network threat analysis against current log data')

                        # initialize raw logs
                        if self.logStore:
                            self.lgr.debug('initializing log data')
                            testingData = self.initializeLogData(self.logStore, uniqueFields, 'testing')
                            if testingData == None:
                                self.lgr.info('no data after initialization for threat detection, sleeping...')
                            else:
                                self.lgr.info('making predictions for testing data')
                                predictionResults = self.networkThreatClassifier.predict(testingData)
                                self.lgr.info('threat detection results :: { ' + str(predictionResults) + ' }')

                                self.lgr.debug('processing threat detection results')
                                self.processTestingResults(results=predictionResults)
                        else:
                            self.lgr.info('no raw log available for threat detection - sleeping...')
                    else:
                        self.lgr.warn('could not train network threat model; threat detection not performed')

                # sleep for determined time
                self.lgr.debug('network threat engine is sleeping for [ ' + str(sleepTime)
                               + ' ] seconds before restarting routines')
                sleep(sleepTime)

