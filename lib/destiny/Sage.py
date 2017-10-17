#!/usr/bin/python3

"""

APP: Inquisition
DESC: A library for finding network threats from given logs based on learned intel
CREATION_DATE: 2017-09-02

"""

# MODULES
# | Native
from os import fork
from time import sleep

# | Third-Party
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


    def startNetworkThreatEngine(self):
        """
        Run network threat analysis engine and all needed components

        :return: void
        """

        # fork process before beginning analysis
        self.lgr.debug('forking off engine to child process')
        newTrainerPID = fork()
        if newTrainerPID == 0:
            # in child process, start analyzing
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

                    # get list of unique fields
                    self.lgr.debug('calculating unique field list for training and testing data initialization')
                    uniqueFieldsForTraining = self.getUniqueLogDataFields(rawTrainingDataset)
                    uniqueFieldsForTesting = self.getUniqueLogDataFields(self.logStore)
                    uniqueFields = list(set(uniqueFieldsForTraining + uniqueFieldsForTesting))

                    trainingData, trainingTargets = self.initializeLogData(rawTrainingDataset, uniqueFields, 'training', targetFieldName)

                    # run model evaluation and print results
                    self.lgr.info('training threat detection model')
                    if self.networkThreatClassifier.fit(trainingData, trainingTargets):
                        self.lgr.info('training complete; starting network threat analysis against current log data')

                        # initialize raw logs
                        if self.logStore:
                            self.lgr.debug('initializing log data')
                            testingData = self.initializeLogData(self.logStore, uniqueFields, 'testing')
                            if testingData == None:
                                self.lgr.info('no data after initialization for threat detection - sleeping...')
                            else:
                                self.lgr.info('making predictions for testing data')
                                predictionResults = self.networkThreatClassifier.predict(testingData)
                                self.lgr.info('threat detection results :: { ' + str(predictionResults) + ' }')
                        else:
                            self.lgr.info('no raw log available for threat detection - sleeping...')
                    else:
                        self.lgr.warn('could not train network threat model; threat detection not performed')

                # sleep for determined time
                self.lgr.debug('network threat engine is sleeping for [ ' + str(sleepTime)
                               + ' ] seconds before restarting routines')
                sleep(sleepTime)

