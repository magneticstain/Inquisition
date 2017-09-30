#!/usr/bin/python3

"""

APP: Inquisition
DESC: The machine learning engine used to detect log anomalies
CREATION_DATE: 2017-09-02

"""

# MODULES
# | Native
from os import fork
from time import sleep

# | Third-Party
from sklearn import cluster

# | Custom
from lib.inquisit.Inquisit import Inquisit
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

    logStore = {}
    baselineLogStore = {}
    logStoreDF = None
    anomalyClassifier = None

    def __init__(self, cfg, sentryClient=None):
        Destiny.__init__(self, cfg, lgrName=__name__, sentryClient=sentryClient)

    def initClassifier(self):
        """
        Initialize classifier model for anomaly detection

        :return: None
        """

        self.anomalyClassifier = cluster.KMeans(n_clusters=2)


    def startAnalysisEngine(self):
        """
        Start Erudite engine and begin analysis

        :return:
        """

        self.lgr.info('starting anomaly detection engine')

        # fork process before beginning analysis
        self.lgr.debug('forking off log anomaly engine trainer to child process')
        newTrainerPID = fork()
        if newTrainerPID == 0:
            # in child process, start analyzing
            # set sleep time
            sleepTime = int(self.cfg['parsing']['sleepTime'])

            # init classifier
            self.lgr.debug('creating anomaly classifier')
            self.initClassifier()

            while True:
                trainingData = None
                testingData = None

                # load in log data
                self.lgr.info('fetching baseline logs for anomaly detection')
                self.baselineLogStore = self.fetchLogData(logType='baseline')

                # check if we have logs available
                if self.baselineLogStore:
                    # initialize data in DF
                    self.lgr.debug('initializing baseline log data for anomaly detection')
                    trainingData = self.initializeLogData(self.baselineLogStore)

                    try:
                        # fit model w/ baseline anomaly data
                        self.lgr.debug('fitting anomaly detection model with log data')
                        if self.anomalyClassifier.fit(trainingData):
                            # fetch new, unknown logs
                            self.lgr.info('fetching new logs for anomaly detection')
                            self.logStore = self.fetchLogData(logType='raw')

                            # initialize log data
                            self.lgr.debug('initializing current log data for anomaly detection')
                            testingData = self.initializeLogData(self.logStore)

                            # try prediction
                            self.lgr.debug('trying prediction for anomaly detection model')
                            self.anomalyClassifier.predict(testingData)
                    except ValueError as e:
                        self.lgr.warn('encountered problem when training anomaly detection engine :: [ ' + str(e) + ' ]')
                else:
                    self.lgr.info('no logs available for anomaly analysis')

                self.lgr.debug('anomaly detection engine sleeping for [ ' + str(sleepTime) + ' ] seconds')
                sleep(sleepTime)

