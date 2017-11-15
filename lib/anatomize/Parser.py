#!/usr/bin/python3

"""
Parser.py

APP: Inquisition
DESC: The log-parsing portion of the Inquisition suite; responsible for parsing incoming logs based on templates
CREATION_DATE: 2017-04-08

"""

# MODULES
# | Native
import datetime
from sys import getsizeof

# | Third-Party
from pygtail import Pygtail

# | Custom
from lib.inquisit.Inquisit import Inquisit
from lib.anatomize.Template import Template

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class Parser(Inquisit):
    """
    Parser engine for Anatomize.py; reads in and processes new logs
    """

    parserID = 0
    parserName = ''
    logFile = ''
    logTTL = 0
    maxLogsToProcess = 0
    offsetFile = ''
    templateStore = {}
    stats = {}
    keepPersistentStats = True
    metricsMode = False
    baselineMode = False

    def __init__(self, cfg, logTTL=30, maxLogsToProcess=0, parserID=0, parserName='Syslog', logFile='/var/log/syslog',
                 keepPersistentStats=True, metricsMode=False, baselineMode=False, sentryClient=None):
        Inquisit.__init__(self, cfg, lgrName=__name__, sentryClient=sentryClient)

        self.parserID = parserID
        self.parserName = parserName
        self.logFile = logFile
        self.logTTL = int(logTTL)
        self.maxLogsToProcess = int(maxLogsToProcess)
        self.keepPersistentStats = bool(keepPersistentStats)
        self.metricsMode = bool(metricsMode)
        self.baselineMode = bool(baselineMode)

        # initialize offset file
        self.offsetFile = '/opt/inquisition/tmp/' + str(self.parserID) + '_' + self.parserName + '.offset'

        # load templates into template store
        self.templateStore = self.fetchTemplates()
        self.lgr.info('loaded [ ' + str(len(self.templateStore)) + ' ] templates for ' + self.__str__())

        self.lgr.debug(self.__str__() + ' created [ SUCCESSFULLY ]')

    def fetchTemplates(self):
        """
        Fetch field templates from database

        :return: dict
        """

        templates = {}

        # fetch templates from DB for relevant parser ID
        sql = """
                SELECT 
                    FT.template_id as TID, 
                    template_name, 
                    field_name, 
                    regex, 
                    regex_group, 
                    regex_match_index 
                FROM 
                    FieldTemplates FT
                JOIN 
                    ParserToFieldTemplateMapping PTFTM 
                USING 
                    (template_id) 
                JOIN 
                    Fields F 
                ON 
                    (FT.field_id=F.field_id)
                JOIN 
                    FieldTemplateRegex FTR 
                ON 
                    (FT.regex_id=FTR.regex_id) 
                WHERE 
                    PTFTM.parser_id = %d
                AND 
                    FT.status = 1
                ORDER BY TID
            """

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql % (int(self.parserID)))

            # fetch results
            dbResults = dbCursor.fetchall()
            for row in dbResults:
                # add each template to template store
                templates[row['TID']] = Template(row['TID'], row['field_name'], row['regex'], row['regex_group'], row['regex_match_index'], row['template_name'])

                self.lgr.debug('loaded template SUCCESSFULLY :: ' + str(templates[row['TID']]))

        return templates

    def updateStatInLogDB(self, statName, action='incrby', incrAmt=0, newVal=0, strict=False, statKey=None,
                          statsType='parser'):
        """
        Perform action on given stat in log db

        :param statName: field name of stat to implement action on
        :param action: db action to perform on stat || Valid actions: incrby, set
        :param incrAmt: if action=incrby, states the amount to increase stat by
        :param newVal: if action=set, this is the new value field is set to
        :param strict: if set to true, only fine stat avg if stat key exists; if not, IndexError is raised
        :param statKey: name of key to save/update stat of
        :param statsType: type of stat to update
        :return: void
        """

        # if keepPersistentStats is turned off, don't bother doing anything further
        if not self.keepPersistentStats:
            # persistent stats disabled, don't touch db
            return

        # check if statKey is set, generate if it's not
        if not statKey:
            # set default stat key
            statKey = str(self.parserID) + '_' + self.parserName

        # set key name for db
        keyName = 'stats:' + statsType + ':' + statKey

        # check if key for stats already exists in log db
        if not self.logDbHandle.exists(keyName) and strict:
            # stats key doesn't exist and we're in strict mode - stat type doesn't exist and we shouldn't create it
            raise IndexError('stat key not present in log database and strict mode is [ ON ]')

        # check what action we should take on stat
        if action == 'incrby':
            # normalize incrementation val
            incrAmt = int(incrAmt)

            # increase stat by incrAmt
            if incrAmt < 1:
                # can't increase by less than 1 in this context, raise exception
                raise ValueError('invalid incrementation amount specified')
            else:
                # increase stat
                self.logDbHandle.hincrby(keyName, statName, incrAmt)
        elif action == 'set':
            # set new val for field (statName)
            self.logDbHandle.hset(keyName, statName, newVal)
        else:
            raise ValueError('invalid action provided :: [ ' + str(action) + ' ]')

    def avgStat(self, statKey, initialVal, newVal, numValsInSet, storeInDb=True, strict=False):
        """
        Find the rolling average of given statistic

        :param statKey: stat to average
        :param initialVal: initial average value
        :param newVal: new value to calculate with initialVal to get new average
        :param numValsInSet: total number of values currently in set, !! NOT including the new value !!
                                that's added here when calculating the avg
        :param storeInDb: flag noting whether to store/update this statistic in the log db (default: T)
        :param strict: if set to true, only find stat avg if stat key exists; if not, IndexError is raised
        :return: void
        """

        # check if stat type exists
        if statKey not in self.stats:
            # stat type DOES NOT exist
            if strict:
                # strict mode - stat type doesn't exist and we shouldn't create it
                raise IndexError('stat key not found and strict mode is [ ON ]')

        # check num values in set
        if numValsInSet < 0:
            # invalid num vals in set
            raise ValueError('invalid value provided for number of values in set when calculating stat avg :: [ '
                             + str(numValsInSet) + ' ]')

        # find average
        avgVal = initialVal + (newVal - initialVal) / (numValsInSet + 1)

        # update in-memory val of stat
        self.stats[statKey] = avgVal

        # update stat in log db, if requested
        if storeInDb:
            self.updateStatInLogDB(statKey, action='set', newVal=avgVal, strict=strict)

    def incrStat(self, statKey, amt, storeInDb=True, strict=False):
        """
        Increase specific statistic by $amt

        :param statKey: stat to increase
        :param amt: amount to increase stat by
        :param storeInDb: flag noting whether to store/update this statistic in the log db (default: T)
        :param strict: if set to true, only increase stat if stat key exists; if not, IndexError is raised
        :return: void
        """

        # make sure amount is valid
        if amt < 0:
            raise ValueError('non-positive amount to increase stat by supplied')

        # check if stat type exists
        if statKey not in self.stats:
            # stat type DOES NOT exist
            if strict:
                # strict mode - stat type doesn't exist and we shouldn't create it
                raise IndexError('stat key not found')
            else:
                # create stat type before increasing it
                self.stats[statKey] = 0

        # increase stat by amt
        self.stats[statKey] += amt

        # update stat in log db, if requested
        if storeInDb:
            self.updateStatInLogDB(statKey, incrAmt=amt, strict=strict)

    def resetParserStats(self, statType=None, statData=None, updateLogDb=True):
        """
        Reset all or specific stat(s)

        :param statType: stat key to reset (default: None, meaning reset all stats)
        :param statData: value to reset stat to
        :param updateLogDb: flag indication whether we should update the db or just the in-memory stats (default: T)
        :return: bool
        """

        # see if stat type exists, and set it if it does
        if statType in self.stats:
            # stat type exists, reset it
            self.stats[statType] = statData

            # check if we should reset it in the db too
            if updateLogDb:
                self.updateStatInLogDB(statType, action='set', newVal=statData)

            return True

        # no stat type specified if we get here, recreate it all
        # initialize default stats for in-memory stat store
        self.stats = {
            'average_log_length': 0,
            'average_log_processing_time': 0,
            'average_log_size': 0,
            'last_run': {
                'num_logs': 0,
                'run_time': 0,
                'logs_per_sec': 0
            },
            'total_log_processing_failures': 0,
            'total_logs_processed': 0,
            'total_matches': 0,
            'total_misses': 0
        }

        # check if db should be re-inited too
        if updateLogDb:
            # remove run-based stats from db set (db support for those isn't supported at this time; see issue #20)
            statsForDb = self.stats
            del statsForDb['last_run']

            # proceed w/ db insertion
            # generate key name
            keyName = 'stats:parser:' + str(self.parserID) + '_' + self.parserName
            # set stat vals in log db
            self.logDbHandle.hmset(keyName, statsForDb)

        # everything reset successfully
        return True

    def printStats(self, runSpecific=False, raw=False):
        """
        Generate stats in string or raw form

        :param raw: flag to determine if raw stats in dict form should be returned (default: False)
        :param runSpecific: flag to determine whether to return general parser stats (F) or stats related to the current
                            run (T)
        :return: str or dict
        """

        # check if raw data should be returned
        if raw:
            return self.stats

        # return stats as string
        # check if we should return general or run-specific stats
        if runSpecific:
            # return run-specific stats
            return '[ NUM LOGS: { ' + str(self.stats['last_run']['num_logs']) + ' } // RUN TIME: { ' \
                   + str(self.stats['last_run']['run_time']) + 's } // LOGS / SEC: { ' \
                   + str(self.stats['last_run']['logs_per_sec']) + ' } ]'
        else:
            # return parser stats
            return '[ TOTAL LOGS PROCESSED: { ' + str(self.stats['total_logs_processed']) \
                   + ' } // TOTAL LOG PROCESSING FAILURES: { ' + str(self.stats['total_log_processing_failures']) \
                   + ' } // AVERAGE LOG PROCESSING TIME: { ' + '%.2f' % float(self.stats['average_log_processing_time']) \
                   + ' microseconds } // AVERAGE LOG SIZE: { ' + str(int(self.stats['average_log_size'])) \
                   + ' } bytes // AVERAGE LOG LENGTH: { ' + str(int(self.stats['average_log_length'])) \
                   + ' } characters ]'

    def parseLog(self, rawLog):
        """
        Parse log into individual fields and stick them in a database

        :param rawLog: a raw log to be processed, coming in in the form of a string
        :return: bool
        """

        logData = {}

        # get current log ID
        logId = self.logDbHandle.get('log_id')
        if not logId:
            # initialize log_id val locally and in log db
            logId = 0
            self.logDbHandle.set('log_id', logId)

        # check logId
        if logId != 0:
            # log ID is a non-zero val (i.e. a utf-8 val), let's decode and normalize it
            logId = int(logId.decode('utf-8'))
        if logId < 0:
            raise ValueError('invalid log ID provided when trying to parse new log')

        # craft db key
        dbKey = ''
        if self.baselineMode:
            dbKey = 'baseline:'
        dbKey += 'log:' + str(self.parserID) + '_' + self.parserName + ':' + str(logId)

        # try to match log against each template in template store
        for templateId in self.templateStore:
            templateKey = str(templateId) + '_' + self.templateStore[templateId].templateName
            matchedString = ''
            try:
                matchedString = self.templateStore[templateId].matchLogAgainstRegex(rawLog)
            except IndexError as e:
                self.lgr.debug('invalid regex options provided :: [ ' + str(e) + ' ]')
            if matchedString:
                # add matched field and value to log data dict
                logData[self.templateStore[templateId].field] = matchedString

                # check if we should log matched value or not
                templateMatchLogMsg = 'template MATCHED log :: ' + str(self.templateStore[templateId])
                if self.cfg.getboolean('logging', 'printMatchValues'):
                    # value should be added in
                    templateMatchLogMsg += ' :: [ VALUE: ' + matchedString + ' ]'
                self.lgr.debug(templateMatchLogMsg)

                # increase match stats for parser
                self.incrStat('total_matches', 1)

                # increase match stats for specific template in db
                self.updateStatInLogDB(statName='matches', incrAmt=1, statKey=templateKey, statsType='template')
            else:
                # didn't match template
                self.lgr.debug('template DID NOT MATCH log :: ' + str(self.templateStore[templateId]))

                # increase miss stats
                self.incrStat('total_misses', 1)

                # increase miss stats for specific template
                self.updateStatInLogDB(statName='misses', incrAmt=1, statKey=templateKey, statsType='template')

        # check if we matched anything
        if not logData:
            # we parsed everything, but nothing matched; go ahead and exit w/ success
            return True

        # add negative threat flag key-value pair if in baseline mode
        if self.baselineMode:
            # known safe log
            logData['threat'] = 0

        # insert log into db
        if self.logDbHandle.hmset(dbKey, logData):
            # set log ttl if applicable
            if not self.baselineMode:
                if self.logTTL <= 0:
                    # invalid TTL provided
                    raise ValueError('invalid log TTL provided :: [ ' + str(self.logTTL) + ' ]')
                else:
                    self.logDbHandle.expire(dbKey, self.logTTL)

            # increase log ID for the next log in line
            if self.logDbHandle.incr('log_id'):
                return True

        return False

    def processLog(self, rawLog):
        """
        Filter and process raw log

        :param rawLog: a raw log to be processed, coming in in the form of a string
        :return: bool
        """

        # check if the log processing max has been reached, exit if so
        if self.maxLogsToProcess > 0 and self.stats['total_logs_processed'] > self.maxLogsToProcess:
            # we hit the limit, let's exit
            self.lgr.info('will NOT PROCESS log, max number of logs to process has been reached')
            return False

        # check if we should print the raw log in our log messages
        if self.cfg.getboolean('logging', 'printMatchValues'):
            rawLogValueForLogs = '< REDACTED BY CONFIG >'
        else:
            rawLogValueForLogs = rawLog

        self.lgr.debug('processing log [[[ ' + rawLogValueForLogs + ' ]]] using ' + self.__str__())

        # remove prepended and trailing newlines/whitespace/etc
        rawLog.strip(" \r\n\t")

        self.lgr.debug('POST-PROCESSED LOG [[[ ' + rawLogValueForLogs + ' ]]] using ' + self.__str__())

        # get memory size of log - in bytes - and add to avg
        memSizeOfLog = getsizeof(rawLog)
        self.avgStat('average_log_size', self.stats['average_log_size'], memSizeOfLog
                     , self.stats['total_logs_processed'])

        # get # of chars in log and add to avg
        self.avgStat('average_log_length', self.stats['average_log_length'], len(rawLog)
                     , self.stats['total_logs_processed'])

        # parse post-processed log
        if not self.parseLog(rawLog):
            # uh oh, couldn't process the log for some reason
            self.incrStat('total_log_processing_failures', 1, True)
            return False

        # increase stat for total number of logs processed
        self.incrStat('total_logs_processed', 1, True)

        return True

    def pollLogFile(self, isTestRun=False, useHazyStateTracking=False, numLogsBetweenTrackingUpdate=0,
                    exitOnMaxLogs=True):
        """
        Tails the log file for new logs and processes them

        :param isTestRun: signifies if we're performing a test run or not
        :param useHazyStateTracking: this feature gives up some exactitude in exchange for better efficiency and
                                        faster speeds; updates the offset file every $numLogsBetweenTrackingUpdate
        :param numLogsBetweenTrackingUpdate: num logs to update offset file after
        :param exitOnMaxLogs: denotes whether we should exit (True) or just return False if we hit the max logs to
                                process limit
        :return: bool
        """

        totalRunStartTime = datetime.datetime.utcnow()

        # check tracking update if applicable
        if useHazyStateTracking:
            if numLogsBetweenTrackingUpdate < 1:
                raise ValueError('invalid tracking update log count ( ' + str(numLogsBetweenTrackingUpdate)
                                 + ' ) w/ hazy state tracking enabled')

        # make sure we haven't already hit the max number of logs we want to read it
        try:
            if self.maxLogsToProcess > 0 and self.stats['total_logs_processed'] >= self.maxLogsToProcess:
                # we hit the limit, let's exit
                self.lgr.info('max number of logs to process has been reached')
                if exitOnMaxLogs:
                    self.lgr.info('exiting successfully due to configuration options')
                    exit(0)
                else:
                    return False
        except KeyError:
            # this means we haven't read any logs and haven't set the TLP stat yet; we can just proceed
            pass

        # reset run stats
        runStats = {
                    'num_logs': 0,
                    'run_time': 0,
                    'logs_per_sec': 0
        }
        self.resetParserStats('last_run', runStats, False)

        # check if hazy state tracking is enabled and set paranoia setting (a setting local to Pygtail) accordingly
        if useHazyStateTracking:
            paranoidMode = False
            self.lgr.debug('enabling hazy state tracking for this run, setting paranoid mode to true')
        else:
            paranoidMode = True
        # NOTE: paranoid denotes updating the offset file after every log is read; statefullness is important ^_^

        # begin polling w/ Pygtail
        try:
            for log in Pygtail(self.logFile, offset_file=self.offsetFile, paranoid=paranoidMode,
                               every_n=numLogsBetweenTrackingUpdate):
                pollStartTime = datetime.datetime.utcnow()

                # try to process the log
                if self.processLog(log):
                    # log parsed successfully :D
                    self.lgr.debug('log processed SUCCESSFULLY :: ' + self.__str__())

                    # break after parsing a single log if running a test run
                    if isTestRun:
                        self.lgr.debug('configured as a test run, stopping parsing')
                        break
                else:
                    # log processing failed :(
                    self.lgr.warning('could not process log :: '  + self.__str__() + ' :: [ ' + log + ' ]')

                    # exit w/ error if we're running a test run
                    if isTestRun:
                        self.lgr.debug('configured as a test run, we should exit')
                        exit(1)

                pollEndTime = datetime.datetime.utcnow()

                # calculate processing time for log
                logProcessingTime = pollEndTime - pollStartTime

                # update ALPT stat
                self.avgStat('average_log_processing_time', self.stats['average_log_processing_time'],
                             logProcessingTime.microseconds, self.stats['total_logs_processed'])

                # incr stat for total log during current run
                # NOTE: last_run stats aren't currently stored in the db for performance reasons; see issue #20
                self.stats['last_run']['num_logs'] += 1
        except PermissionError as e:
            self.lgr.error('permission denied when trying to access target log file :: ' + self.__str__()
                           + ' :: [ MSG: ' + str(e) + ' ]')
            if Inquisit.sentryClient:
                Inquisit.sentryClient.captureException()
        except FileNotFoundError as e:
            self.lgr.error('could not open file for parser :: ' + self.__str__() + ' :: [ MSG: ' + str(e) + ' ]')
            if Inquisit.sentryClient:
                Inquisit.sentryClient.captureException()
        except UnicodeDecodeError as e:
            self.lgr.error('content with invalid formatting found in target log file :: ' + self.__str__()
                           + ' :: [ MSG: ' + str(e) + ' ]')
            if Inquisit.sentryClient:
                Inquisit.sentryClient.captureException()

        totalRunEndTime = datetime.datetime.utcnow()

        # update last run time stat
        totalRunTime = totalRunEndTime - totalRunStartTime
        self.stats['last_run']['run_time'] = totalRunTime.seconds or 1
        # the or operation above usually happens during the first run; defaults to 1s

        # calc LPS for latest run
        self.stats['last_run']['logs_per_sec'] = self.stats['last_run']['num_logs'] / \
                                                 self.stats['last_run']['run_time']

        # print run stats
        statsLogMsg = '|-- PARSER STATS - PER RUN --| :: ' + self.__str__() + ' :: ' \
                      + self.printStats(runSpecific=True)
        # print as debug level unless in metrics mode
        if self.metricsMode:
            self.lgr.info(statsLogMsg)
        else:
            self.lgr.debug(statsLogMsg)

        return True

    def __str__(self):
        """
        Print metadata as a string

        :return: str
        """

        return '[ PARSER ID: ' + str(self.parserID) + ' // NAME: ' + self.parserName + ' // READING FROM LOG FILE: ' \
               + self.logFile + ' // OFFSET FILE: ' + self.offsetFile + ' ]'

