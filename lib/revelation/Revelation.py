#!/usr/bin/python3

"""

APP: Inquisition
DESC: Revelation.py - alert framework for use with detection engines
CREATION_DATE: 2017-10-15

"""

# MODULES
# | Native
import json

# | Third-Party
from pymysql import err

# | Custom
from lib.inquisit.Inquisit import Inquisit
from lib.revelation.Alert import Alert

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__license__ = 'MIT'
__version__ = '2019.0.0.1-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class Revelation(Inquisit):
    """
    Alert framework for use with analysis engines
    """

    alertStore = []

    def __init__(self, cfg, sentryClient=None):
        Inquisit.__init__(self, cfg, lgrName=__name__, sentryClient=sentryClient)

    def addAlertToDB(self, alert):
        """
        Add alert with given data to entry in Inquisition DB

        :param alert: alert object who's data we're adding to the db
        :return: bool
        """

        # set sql
        sql = """
                INSERT INTO 
                    Alerts
                (
                    alert_type, 
                    host, 
                    src_node, 
                    dst_node, 
                    alert_detail,
                    log_data
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
        """

        # run sql query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            try:
                dbCursor.execute(sql, (alert.alertType, alert.host, alert.srcNode, alert.dstNode, alert.alertDetails,
                                       alert.logData))
                self.inquisitionDbHandle.commit()
                if self.getCfgValue(section='logging', name='verbose', defaultVal=False, dataType=bool):
                    self.lgr.debug(
                        'successfully added alert ' + str(alert) + ' to Inquisition database')
            except err as e:
                self.inquisitionDbHandle.rollback()
                self.lgr.critical(
                    'database error when adding new alert ' + str(alert) + ' :: [ ' + str(e) + ' ]')
            finally:
                dbCursor.close()

    def addAlert(self, timestamp=0, alertType=1, status=0, host='127.0.0.1', srcNode='0.0.0.0', dstNode='0.0.0.0',
                 alertDetails='', logData=None, serializeLogData=True, addAlertToDb=True):
        """
        Generate an alert with given parameters and make it persistent
\
        :param timestamp: timestamp that alert was generated, in epoch time
        :param alertType: type of alert: 1 = host anomaly, 2 = traffic node anomaly, 3 = threat
        :param status: status of alert: 0 = NEW, 1 = ACKNOWLEDGED, 2 = RESOLVED
        :param host: host that generated the alert
        :param srcNode: source host that generated the alert
        :param dstNode: destination host that generated the alert
        :param alertDetails: blob of text constituting the additional details of the alert
        :param logData: a key-value pair representation of the log that generated the alert
        :param serializeLogData: bool denoting whether to serialize the data or not if it's already been serialized
        :param addAlertToDb: bool determining whether we should add the alert to the db along with the alert store
        :return: void
        """

        if timestamp < 0:
            raise ValueError('invalid alert timestamp provided :: [ ' + str(timestamp) + ' ]')

        if alertType < 1 or 3 < alertType:
            raise ValueError('invalid alert type provided :: [ ' + str(alertType) + ' ]')

        if status < 0 or 2 < status:
            raise ValueError('invalid alert status provided :: [ ' + str(status) + ' ]')

        if serializeLogData:
            # serialize log data as json for storage in db
            logData = json.dumps(logData)

        # create alert
        alert = Alert(timestamp=timestamp, alertType=alertType, status=status, host=host, srcNode=srcNode,
                      dstNode=dstNode, alertDetails=alertDetails, logData=logData)
        self.lgr.debug('created new alert :: ' + str(alert))

        # add to alert store
        self.alertStore.append(alert)

        if addAlertToDb:
            # add alert in db
            self.addAlertToDB(alert=alert)

