#!/usr/bin/python3

"""

APP: Inquisition
DESC: Revelation.py - alert framework for use with detection engines
CREATION_DATE: 2017-10-15

"""

# MODULES
# | Native

# | Third-Party
from pymysql import err

# | Custom
from lib.inquisit.Inquisit import Inquisit
from lib.revelation.Alert import Alert

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
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
        Sync alert with given data to entry in Inquisition DB

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
                    alert_detail
                )
                VALUES
                (
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
                dbCursor.execute(sql, (alert.alertType, alert.host, alert.srcNode, alert.dstNode, alert.alertDetails))
                self.inquisitionDbHandle.commit()
                if self.cfg.getboolean('logging', 'verbose'):
                    self.lgr.debug(
                        'successfully added alert ' + str(alert) + ' to Inquisition database')

                return True
            except err as e:
                self.lgr.critical(
                    'database error when adding new alert ' + str(alert) + ' :: [ ' + str(
                        e) + ' ]')
                self.inquisitionDbHandle.rollback()

                return False

    def addAlert(self, timestamp=0, alertType=0, status=0, host='127.0.0.1', srcNode='0.0.0.0', dstNode='0.0.0.0', alertDetails=''):
        """
        Generate an alert with given parameters
\
        :param timestamp: timestamp that alert was generated, in epoch time
        :param alertType: type of alert: 0 = host anomaly, 1 = traffic node anomaly, 2 = threat
        :param status: status of alert: 0 = NEW, 1 = ACKNOWLEDGED, 2 = RESOLVED
        :param host: host that generated the alert
        :param srcNode: source host that generated the alert
        :param dstNode: destination host that generated the alert
        :param alertDetails: blob of text constituting the additional details of the alert
        :return: void
        """

        if timestamp < 0:
            raise ValueError('invalid alert timestamp provided :: [ ' + str(timestamp) + ' ]')

        if alertType < 0 or 1 < alertType:
            raise ValueError('invalid alert type provided :: [ ' + str(alertType) + ' ]')

        if status < 0 or 2 < status:
            raise ValueError('invalid alert status provided :: [ ' + str(status) + ' ]')

        # create alert
        alert = Alert(timestamp=timestamp, alertType=alertType, status=status, host=host, srcNode=srcNode, dstNode=dstNode, alertDetails=alertDetails)
        self.lgr.debug('created new alert :: ' + str(alert))

        # add to alert store and db
        self.alertStore.append(alert)

        # add/update alert
        self.addAlertToDB(alert=self.alertStore[-1])

