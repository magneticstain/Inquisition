#!/usr/bin/python3

"""
Destiny.py

APP: Inquisition
DESC: Destiny.py - An intelligent engine used to take Anatomize() data and create new security events based on rules and machine-learning
CREATION_DATE: 2017-04-08

"""

# MODULES
# | Native

# | Third-Party
from sklearn import feature_extraction,preprocessing

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

    featureVectorizer = None
    labelVectorizer = None

    def __init__(self, cfg, lgrName, sentryClient=None):
        Inquisit.__init__(self, cfg, lgrName=lgrName, sentryClient=sentryClient)

    def fetchLogData(self, logType='raw'):
        """
        Read in specified log data from log DB

        :param logType: type of log data to read in; ['raw','intel']; default = 'raw'
        :return: dict
        """

        logData = {}

        # normalize type
        logType = logType.lower()

        # set search key based on log type we're fetching
        if logType == 'raw':
            logDbSearchKey = 'log:*'
        elif logType == 'intel':
            logDbSearchKey = 'intel:*'
        elif logType == 'baseline':
            logDbSearchKey = 'baseline:*'
        else:
            raise ValueError('invalid log type specified')

        # attempt to retrieve data from db
        self.lgr.debug('fetching logs from log db')
        rawLogs = self.logDbHandle.scan_iter(logDbSearchKey)

        # decode from utf-8
        self.lgr.debug('decoding all log data from log db')
        for logRecordKey in rawLogs:
            # get log data in key-value form
            logItem = self.logDbHandle.hgetall(logRecordKey)

            # decode log item data
            decodedLogItem = {logItemDataName.decode('utf-8'): logItemDataVal.decode('utf-8')
                              for logItemDataName, logItemDataVal in logItem.items()}

            # add to log data collection
            logData[logRecordKey.decode('utf-8')] = decodedLogItem

        return logData

    def getUniqueLogDataFields(self, logData):
        """
        Returns unique list of field names from log data for future use as learning model features

        :param logData: dataset of logs to derive list of log fields from
        :return: list
        """

        fields = []

        # traverse each log in log store
        for logIdx in logData:
            for field in logData[logIdx]:
                # check if decoded field name is unique
                if field not in fields:
                    # unique - add to field list
                    fields.append(field)

        return fields

    def encodeLogData(self, data, isTargetData=False, shouldFit=True):
        """
        Encode log data using vectorizer

        :param logData: pre-formatted log data for vectorization
        :param isTargetData: bool specifying if we're dealing with target data as it currently uses a different encoder
        :param shouldFit: bool for flagging whether we should fit the data of just transform it (used w/ testing data)
        :return: numpy array
        """

        if not data:
            raise ValueError('no log data provided for vectorization')

        # check if we have target data or not and set vectorizer as such
        if isTargetData:
            # target data, use label encoder
            # check if vectorizer has been created yet
            if not self.labelVectorizer:
                self.labelVectorizer = preprocessing.LabelEncoder()

            # encode data now since fitting is always done w/ target data
            encData = self.labelVectorizer.fit_transform(data)

            return encData
        else:
            # receiving regular dataset, use one-hot encoding via DicVectorizer
            # check if vectorizer has been created yet
            if not self.featureVectorizer:
                self.featureVectorizer = feature_extraction.DictVectorizer()

            # encode data
            if shouldFit:
                encData = self.featureVectorizer.fit_transform(data)
            else:
                # using testing data, which means we're not using target data
                encData = self.featureVectorizer.transform(data)

            return encData

    def initializeLogData(self, logData, uniqueFields, dataUsage, targetFieldName=None):
        """
        Initialize given log data as feature/label dataframes

        :param logData: dataset of logs
        :param uniqueFields: list of unique fields in all datasets
        :param dataUsage: designates what this data is used for (training or testing)
        :param targetFieldName: name of field to use for target data
        :return: dataframes
        """

        data = []
        targets = []

        if not logData:
            raise ValueError('no log data provided for initialization')
        if dataUsage != 'testing' and not targetFieldName:
            raise ValueError('no target field name provided for initialization')

        # remove target field from unique field list
        if dataUsage != 'testing':
            uniqueFields.remove(targetFieldName)

        # format log data as data frames for use as model data
        self.lgr.debug('initializing log data matrix')
        # traverse each log in log store to add to list
        for logIdx in logData:
            # start collecting data vals
            # append target field value to target dataset if not working with testing data
            if dataUsage != 'testing':
                try:
                    targets.append(logData[logIdx][targetFieldName])
                except KeyError:
                    self.lgr.warn('no value found for target field for given log, discarding log entry')
                    continue

            # iterate through each unique field name to see if value is set (== null if it isn't) and place into list
            # init blank log entry
            logEntry = {}
            for field in uniqueFields:
                # try appending log value to log entry if it exists
                try:
                    logEntry[field] = logData[logIdx][field]
                except KeyError:
                    # value not found for this log; set as 0
                    logEntry[field] = '0'

            # append log entry to master dataset
            data.append(logEntry)

        # transform data and targets (if appl.) for use w/ model; and set as DF
        self.lgr.info('vectorizing log data')
        if dataUsage == 'testing':
            # initializing testing data; we won't have any target data and will need to specify to not fit the data when
            # encoding it (only transforming)

            # data
            encData = self.encodeLogData(data, shouldFit=False)
            # encData = self.encodeLogData(data, shouldFit=True)
            return encData
        else:
            # working with training data; we'll have targets and WILL need to fit the data

            # data
            encData = self.encodeLogData(data)

            # targets
            encTargets = self.encodeLogData(targets, True)

            return encData, encTargets

