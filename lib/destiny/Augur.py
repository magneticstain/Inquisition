#!/usr/bin/python3

"""
Augur.py

APP: Inquisition
DESC: A library used to fetch and receive OSINT data used for further learning
CREATION_DATE: 2017-05-14

"""

# MODULES
# | Native
from os import fork
from time import sleep
import urllib3

# | Third-Party
from pymysql import OperationalError
from bs4 import BeautifulSoup as BSoup

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

# GLOBALS
# set OSINT API URLs
OSINT_API_URLS = {
    'SANS_DShield': 'https://isc.sans.edu/api/openiocsources/'
}

class Augur(Inquisit):
    """
    OSINT aggregation utility
    """

    connPool = None
    masterDataset = []

    def __init__(self, cfg, sentryClient=None):
        Inquisit.__init__(self, cfg, lgrName=__name__, sentryClient=sentryClient)

        # start connection pool manager
        self.connPool = urllib3.PoolManager()

    def getXMLSrcData(self, url):
        """
        Fetch raw XML from given URL and return as dict

        :param url: url to fetch XML from
        :return: BeautifulSoup obj
        """

        resp = None

        if not url:
            raise ValueError('invalid URL passed for XML src')

        # try fetching XML from URL
        self.lgr.debug('contacting server for XML data :: [ ' + url + ' ]')
        try:
            resp = self.connPool.request('GET', url)
            self.lgr.debug('received HTTP status code [ ' + str(resp.status) + ' ] :: [ ' +  url + ' ]')
        except Exception as e:
            self.lgr.critical('could not connect to XML source :: [ ' + url + ' ] :: [ ' + str(e) + ' ]')

        # if data was found, decode it and send to parser
        if resp and resp.data:
            # decode http response data
            xml = resp.data.decode('utf-8')

            # parse xml and return
            # good example of parsing using BSoup lib: https://stackoverflow.com/a/4093940
            bs = BSoup(xml, 'xml')
            return bs
        else:
            return {}

    def mapIOCItemNameToFieldName(self, iocItemName):
        """
        Map a given IOC item name to a log field name for normalization purposes

        :param iocItemName: IOC item name (e.g. srcPort)
        :return: str
        """

        if not iocItemName:
            raise ValueError('invalid IOC item name provided')

        sql = """
                SELECT 
                    field_name 
                FROM
                    IOCItemToFieldMapping IITFM 
                JOIN
                    Fields F 
                USING
                    (field_id) 
                WHERE
                    IITFM.ioc_item_name = '%s'
              """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql % (iocItemName))

            # fetch results
            dbResults = dbCursor.fetchone()
            dbCursor.close()

            if dbResults:
                return dbResults['field_name']
            else:
                return ''

    def parseIntelXML(self, rawXml):
        """
        Parse given XML into IOC items

        :param rawXml: xml to be parsed
        :return: list
        """

        if not rawXml:
            raise ValueError('no XML provided for parsing')

        iocData = {}
        iocItemCount = 0

        # parse xml
        for ioc in rawXml.find_all('Indicator'):
            # get IOC ID
            iocId = ioc.get('id')

            # strip info from each IOC item
            iocItemData = {}
            for iocItem in ioc.find_all('IndicatorItem'):
                iocItemCount += 1

                # format iocItem name and ID
                iocItemName = iocItem.Context.get('search').split('/')[1]

                # map ioc item name to log field name
                # NOTE: we do this in order to normalize data for use with the rest of the Destiny sub-modules
                if iocItemName:
                    fieldName = self.mapIOCItemNameToFieldName(iocItemName)
                    if not fieldName:
                        fieldName = 'UNKNOWN'

                    # add item value to ioc item data
                    iocItemData[fieldName] = iocItem.Content.string

            # add threat field and flag to ioc item data
            iocItemData['threat'] = 1

            # add ioc item data to ioc dataset
            iocData[iocId] = iocItemData

        self.lgr.debug('parsed [ ' + str(len(iocData)) + ' ] IOC items from XML')

        return iocData

    def saveIntelData(self, intelData):
        """
        Insert intel into log db and master ioc dataset

        :param intelData: data to insert as intel data record
        :return: bool
        """

        if not intelData:
            raise ValueError('no intel data provided to save')

        numIocItems = 0
        numNewIocItems = 0

        # traverse through intel data and save each record if it doesn't already exist
        for iocDatasetName in intelData:
            # save each IOC item in dataset
            for iocRemoteId in intelData[iocDatasetName]:
                numIocItems += 1

                # generate log DB key
                key = 'intel:' + iocDatasetName + ':' + iocRemoteId

                # check if key already exists
                if not self.logDbHandle.exists(key):
                    numNewIocItems += 1

                    # IOC item hasn't been added yet; insert into db
                    self.logDbHandle.hmset(key, intelData[iocDatasetName][iocRemoteId])

        self.lgr.info('saved [ ' + str(numNewIocItems) + ' ] new intel data records out of [ ' + str(numIocItems)
                      + ' ] sent')

    def fetchIntelData(self):
        """
        Fetch all OSINT data, parse it, and record it in the database

        :return: void
        """

        iocData = {}

        # check if this is a test run
        try:
            testRun = self.cfg.getboolean('cli', 'test_run')
        except KeyError:
            # test run not defined, set to default of FALSE
            self.lgr.warning('test run flag not set, defaulting to [ FALSE ]')

            testRun = False

        # fork process before beginning stream
        self.lgr.debug('forking off OSINT feed (Augur) to child process')
        newCollectorPID = fork()
        if newCollectorPID == 0 or testRun:
            # in child process, bounce inquisition DB handle (see issue #66)
            try:
                self.bounceInquisitionDbConnection()
            except OperationalError as e:
                self.lgr.critical('could not create database connection :: [ ' + str(e) + ' ]')
                if self.sentryClient:
                    self.sentryClient.captureException()

                exit(1)

            while True:
                # fetch data
                self.lgr.info('fetching intel data')
                for apiName in OSINT_API_URLS:
                    url = OSINT_API_URLS[apiName]

                    # get API XML
                    self.lgr.debug('fetching XML from API server :: [ ' + url + ' ]')
                    rawXml = self.getXMLSrcData(url=url)

                    # parse out IOCs
                    if rawXml:
                        self.lgr.debug('parsing intel XML for [ ' + apiName + ' ]')
                        iocData[apiName] = self.parseIntelXML(rawXml)
                    else:
                        # could not fetch XML
                        self.lgr.error('could not fetch intel data feed :: [ ' + url + ' ]')

                # make ioc data persistent
                self.lgr.debug('saving intel data')
                self.saveIntelData(iocData)

                # check if running a test run
                if testRun:
                    self.lgr.debug('test run, exiting anatomizer loop')
                    break

                # sleep for specified time
                sleepTime = self.cfg['intel']['sleepTime']
                self.lgr.debug('sleeping for [ ' + str(sleepTime) + ' ] seconds')
                sleep(int(sleepTime))

