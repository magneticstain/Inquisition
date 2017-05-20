#!/usr/bin/python3

"""
Destiny.py

APP: Inquisition
DESC: An intelligent engine used to take Anatomize() data and create new security events based on rules and machine-learning
CREATION_DATE: 2017-04-08

"""

# MODULES
# | Native
from os import fork
from time import sleep

# | Third-Party
import tensorflow as tf
import pandas as pd

# | Custom
from lib.inquisit.Inquisit import Inquisit

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class Destiny(Inquisit):
    """
    Base framework used across the Destiny engine
    """

    baselineLogStore = {}
    logStore = {}
    modelData = {
        'training': [],
        'testing': []
    }
    networkBaselineModel = None

    def __init__(self, cfg, modelType='std_loss'):
        Inquisit.__init__(self, cfg, lgrName=__name__)

    def fetchLogData(self, baseline=False):
        """
        Read in baseline or realtime log data from log DB

        :param baseline: flag noting which log data to fetch; fetches baseline logs if true, realtime logs if false
        :return: void
        """

        logData = {}

        # set search key based on baseline or realtime data
        logDbSearchKey = ''
        if baseline:
            logDbSearchKey = '_baseline:'
        logDbSearchKey += 'log:*'

        # attempt to retrieve data from db
        for logRecord in self.logDbHandle.scan_iter(logDbSearchKey):
            # get log data in key-value form
            logData[logRecord.decode('utf-8')] = self.logDbHandle.hgetall(logRecord)

        return logData

    def initializeLogData(self):
        """
        Fetch all log store data (in dict format)
        
        :return: void 
        """

        # fetch raw log data
        self.baselineLogStore = self.fetchLogData(baseline=True)
        self.logStore = self.fetchLogData(baseline=False)

        # format log data as data frames for use as model data
        self.modelData['training'] = self.createLogMatrix('training')
        self.modelData['testing'] = self.createLogMatrix('testing')

    def getLogDataFields(self, logData):
        """
        Returns list of field names from log data for future use as learning model features
        
        :param logData: dataset of logs to derive list of log fields from
        :return: list
        """

        fields = []

        # traverse each log in log store
        for logIdx in logData:
            # traverse the fields of each log
            for field in logData[logIdx]:
                # check if field has already been added to list; add if it hasn't
                if field not in fields:
                    fields.append(field)

        return fields

    def fetchAllValsForField(self, field, logData):
        """
        Returns list of all values we have in the log store for a given field name
        
        :param logData: dataset of logs to derive list of values for field from
        :return: list
        """

        # make sure field and dataset are both valid
        if not field:
            raise ValueError('invalid field value provided')
        if not logData:
            raise ValueError('cannot fetch field-specific values; no log dataset provided')

        values = []

        # traverse each log in log store
        for logIdx in logData:
            # add value of field in given log if exists
            if field in logData[logIdx]:
                val = logData[logIdx][field].decode('utf-8')
            else:
                # field not present in log; use null value
                val = ''

            # append val to set
            values.append(val)

        return values

    def createLogMatrix(self, logMatrixDatasetType):
        """
        Create matrix out of all log data
        
        :param logMatrixDatasetType: type of data to create log matrix for (training|testing)
        :return: panda dataframe
        """

        dataset = {}
        logMatrix = {}

        # normalize and check logMatrixDatasetType
        logMatrixDatasetType = logMatrixDatasetType.lower()
        if logMatrixDatasetType not in ['training', 'testing']:
            raise ValueError('invalid dataset type provided')

        # get local data
        if logMatrixDatasetType == 'training':
            dataset = self.baselineLogStore
        elif logMatrixDatasetType == 'testing':
            dataset = self.logStore

        # create keys from each field
        for field in self.getLogDataFields(dataset):
            # set field-specific data
            logMatrix[field] = self.fetchAllValsForField(field, dataset)

        # create dataframe from log data
        return pd.DataFrame.from_dict(logMatrix)

    def networkBaselineInputFn(self, inputDF):
        """
        Input function for use with network baseline model
        
        :param inputDF: data frame to use for processing
        :return: tuple (features, labels)
        """

        # generate model feature colns
        featureColns = {}
        label = tf.Variable(1.)

        # format input dataframe as feature colns
        for colnName in inputDF:
            featureColns[colnName] = tf.constant(inputDF[colnName].values)

        return featureColns, label

    def networkBaselineTrainingInputFn(self):
        """
        Abstracted class for running the model input function with training data
        
        :return: tuple (features, labels)
        """

        return self.networkBaselineInputFn(self.modelData['training'])

    def networkBaselineEvaluationInputFn(self):
        """
        Abstracted class for running the model input function with testing data
        
        :return: tuple (features, labels)
        """

        return self.networkBaselineInputFn(self.modelData['testing'])

    def getModelFeatures(self):
        """
        Returns list of learning model features based on log fields

        :return: dict
        """

        features = []

        # get log fields that features will be based on
        # we'll want to get the uniqe fields of both training and testing datasets
        logFields = list(set(self.getLogDataFields(self.baselineLogStore) + self.getLogDataFields(self.logStore)))

        # traverse log fields and create feature out of each one
        for field in logFields:
            features.append(tf.contrib.layers.sparse_column_with_hash_bucket(field, hash_bucket_size=1e7))

        return features

    def createNetworkBaselineTrainingModel(self):
        """
        Creates TensorFlow model for LinearClassifier training on log data

        :return: bool
        """

        # get features
        features = self.getModelFeatures()

        # initialize estimator
        if features:
            self.networkBaselineModel = tf.contrib.learn.LinearClassifier(feature_columns=features)

            return True
        else:
            self.lgr.info('not creating network baseline learning model; no log data available')
            return False

    def startNetworkBaselineModelTraining(self):
        """
        Start machine-learning training for network baseline model

        :return: void
        """

        # start model fitting
        self.networkBaselineModel.fit(input_fn=self.networkBaselineTrainingInputFn, steps=1000)

    def getNetworkBaselineModelEvaluation(self):
        """
        Evaluate machine-learning training for network baseline model

        :return: void
        """

        # load baseline

        # generate model eval
        modelEvalResults = self.networkBaselineModel.evaluate(input_fn=self.networkBaselineEvaluationInputFn,
                                                              steps=1000)

        return modelEvalResults

    def runNetworkBaselineModel(self):
        """
        Run each element of network baseline model
        
        :return: void
        """

        # fork process before beginning analysis
        self.lgr.debug('forking off network baseline trainer to child process')
        newTrainerPID = fork()
        if newTrainerPID == 0:
            # in child process, start analyzing
            # initialize log datae
            self.lgr.info('initializing data for learning models')
            self.initializeLogData()

            # create model
            self.lgr.debug('creating network baseline learning model')
            if self.createNetworkBaselineTrainingModel():
                # run model after every $sleepTime seconds
                sleepTime = int(self.cfg['parsing']['sleepTime'])
                while True:
                    # model created let's train it
                    if not self.baselineLogStore:
                        self.lgr.warning('no baseline data available, not able to start training for learning model')
                    else:
                        # baseline data present, let's try training our model
                        self.lgr.debug('starting training for network baseline learning model')
                        self.startNetworkBaselineModelTraining()

                        # run model evaluation and print results
                        if not self.logStore:
                            self.lgr.warning('no new log data available, nothing to evaluate against learning model')
                        else:
                            self.lgr.debug('running network baseline learning model evaluation')
                            modelEval = self.getNetworkBaselineModelEvaluation()
                            for key in sorted(modelEval):
                                self.lgr.info(key + ': ' + modelEval[key])

                    # sleep for determined time
                    self.lgr.debug('network baseline model is sleeping for [ ' + str(sleepTime)
                                   + ' ] seconds before restarting routines')
                    sleep(sleepTime)

