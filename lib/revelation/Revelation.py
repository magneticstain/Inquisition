#!/usr/bin/python3

"""

APP: Inquisition
DESC: Revelation.py - alert framework for use with detection engines
CREATION_DATE: 2017-10-15

"""

# MODULES
# | Native

# | Third-Party

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


    def addAlert(self, logData, timestamp=0, alertType=0, status=0):
        """
        Generate an alert with given parameters

        :param logData: dict of a log, including fieds and their values
        :param timestamp: timestamp that alert was generated, in epoch time
        :param alertType: type of alert: 0 = anomaly, 1 = threat
        :param status: status of alert: 0 = NEW, 1 = ACKNOWLEDGED, 2 = RESOLVED
        :return: void
        """

        # check params
        if not logData:
            raise ValueError('no log data provided')

        if timestamp < 0:
            raise ValueError('invalid alert timestamp provided :: [ ' + str(timestamp) + ' ]')

        if alertType < 0 or 1 < alertType:
            raise ValueError('invalid alert type provided :: [ ' + str(alertType) + ' ]')

        if status < 0 or 2 < status:
            raise ValueError('invalid alert status provided :: [ ' + str(status) + ' ]')

        # create alert
        alert = Alert(logData=logData, timestamp=timestamp, alertType=alertType, status=status)
        self.lgr.debug('created new alert :: ' + str(alert))

        # add to alert store and db
        self.alertStore.append(alert)

        # TODO: add alert to db once schema is done


