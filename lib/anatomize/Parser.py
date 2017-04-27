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
from lib.anatomize.Template import Template

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__copyright__ = 'Copyright 2017, CarlsoNet'
__license__ = 'MIT'
__version__ = '1.0.0-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


class Parser:
    lgr = None
    inquisitionDbHandle = None
    logDbHandle = None
    parserID = 0
    parserName = ''
    logFile = ''
    logTTL = 0
    offsetFile = ''
    templateStore = {}
    stats = {}
    keepPersistentStats = True

    def __init__(self, lgr, inquisitionDbHandle, logDbHandle, logTTL=30, parserID=0, parserName='Syslog',
                 logFile='/var/log/syslog', keepPersistentStats=True):
        self.lgr = lgr
        self.inquisitionDbHandle = inquisitionDbHandle
        self.logDbHandle = logDbHandle
        self.parserID = parserID
        self.parserName = parserName
        self.logFile = logFile
        self.logTTL = int(logTTL)
        self.keepPersistentStats = bool(keepPersistentStats)

        # initialize offset file
        self.offsetFile = '/opt/inquisition/tmp/' + str(self.parserID) + '_' + self.parserName + '.offset'
        # load templates for template store
        self.templateStore = self.fetchTemplates()
        self.lgr.info('loaded [ ' + str(len(self.templateStore)) + ' ] templates for ' + self.__str__())

        self.lgr.debug(self.__str__() + ' created SUCCESSFULLY')

    def fetchTemplates(self):
        """
        Fetch field templates from database

        :return: dict
        """

        templates = {}

        # fetch templates from DB for relevant parser ID
        sql = '''
                SELECT 
                    FT.template_id as TID, 
                    template_name, 
                    field_name, 
                    regex 
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
            '''

        # execute query
        with self.inquisitionDbHandle.cursor() as dbCursor:
            dbCursor.execute(sql % (int(self.parserID)))

            # fetch results
            dbResults = dbCursor.fetchall()
            for row in dbResults:
                # add each template to template store
                templates[row['TID']] = Template(row['TID'], row['field_name'], row['regex'], row['template_name'])

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

        # check is statKey is set, generate if it's not
        if not statKey:
            # set default stat key
            statKey = str(self.parserID) + '_' + self.parserName
        # set key name
        keyName = 'stats:' + statsType + ':' + statKey

        # check if key for stats already exists; if not, initialize it
        if not self.logDbHandle.exists(keyName) and strict:
            # stats key doesn't exist and we're in strict mode - stat type doesn't exist and we shouldn't create it
            raise IndexError('stat key not present in log database and strict mode is [ ON ]')

        # check what action we should take on stat
        if action == 'incrby':
            # normalize incrementation val
            incrAmt = int(incrAmt)

            # increase stat by incrAmt
            if incrAmt < 1:
                # can't increase by less than 1, raise exception
                raise ValueError('invalid incrementation amount specified')
            else:
                # increase stat
                self.logDbHandle.hincrby(keyName, statName, incrAmt)
        elif action == 'set':
            # set new val for field (statName)
            self.logDbHandle.hset(keyName, statName, newVal)
        else:
            raise ValueError('invalid action provided :: [ ' + str(action) + ' ]')


    def avgStat(self, statKey, initialVal, newVal, storeInDb=True, strict=False):
        """
        Find the average of two valuesL initial, established average along with the new value to be incl. w/ initial avg
        
        :param statKey: stat to average
        :param initialVal: initial average value
        :param newVal: new value to calculate with initialVal to get new average
        :param storeInDb: flag noting whether to store/update this statistic in the log db (default: T)
        :param strict: if set to true, only fine stat avg if stat key exists; if not, IndexError is raised
        :return: void
        """

        # check if stat type exists
        if statKey not in self.stats:
            # stat type DOES NOT exist
            if strict:
                # strict mode - stat type doesn't exist and we shouldn't create it
                raise IndexError('stat key not found and strict mode is [ ON ]')
            else:
                # create stat type before averaging it
                self.stats[statKey] = 0

        # find average
        if initialVal == 0:
            # first or reset value, set as initial val
            avgVal = newVal
        else:
            # calc avg
            avgVal = (initialVal + newVal) / 2

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

    def resetParserStats(self, statType=None, statData=0, updateLogDb=True):
        """
        Reset all or specific stat(s)
        
        :param statType: stat key to reset (default: None, meaning reset all stats)
        :param statData: value to reset stat to
        :param updateLogDb: flag indication whether we should update the db or just the in-memory stats (default: T)
        :return: bool
        """

        # see if stat type exists and set it if it does
        if statType in self.stats:
            # stat type exists, reset it
            self.stats[statType] = statData

            # check if we should reset it in the db too
            if updateLogDb:
                self.updateStatInLogDB(statType, action='set', newVal=statData)

            return True

        # no stat type specified, recreate it all
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
            # remove run-based stats from db set (db support for those isn't supported at this time)
            statsForDb = self.stats
            del statsForDb['last_run']

            # proceed w/ db insertion
            # generate key name
            keyName = 'stats:parser:' + str(self.parserID) + '_' + self.parserName
            # set stat vals in log db
            self.logDbHandle.hmset(keyName, statsForDb)

        # stat doesn't exist, can't reset it
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
            # initialize log_id val
            logId = 0
            self.logDbHandle.set('log_id', logId)

        # check logId
        if logId != 0:
            # log ID a non-zero val (i.e. a utf-8 val from the log db), let's decode and normalize it
            logId = int(logId.decode('utf-8'))
        if logId < 0:
            raise ValueError('invalid log ID provided when trying to parse new log')

        # craft db key
        dbKey = 'log:' + str(self.parserID) + '_' + self.parserName + ':' + str(logId)

        # try to match log against each template in template store
        for templateId in self.templateStore:
            templateKey = str(templateId) + '_' + self.templateStore[templateId].templateName
            matchedString = self.templateStore[templateId].matchLogAgainstRegex(rawLog)
            if matchedString:
                # add matched field and value to log data dict
                logData[self.templateStore[templateId].field] = matchedString
                self.lgr.debug('template MATCHED log :: ' + str(self.templateStore[templateId]))

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

        # insert log into db
        if self.logDbHandle.hmset(dbKey, logData):
            # set log ttl
            logTTL = int(self.logTTL)
            if logTTL <= 0:
                # invalid TTL provided
                raise ValueError('invalid log TTL provided :: [ ' + str(logTTL) + ' ]')
            else:
                self.logDbHandle.expire(dbKey, self.logTTL)

            # increase log ID
            if self.logDbHandle.incr('log_id'):
                return True

        return False

    def processLog(self, rawLog):
        """
        Filter and process raw log
        
        :param rawLog: a raw log to be processed, coming in in the form of a string
        :return: bool
        """

        self.lgr.debug('processing log [[[ ' + rawLog + ' ]]] using ' + self.__str__())

        # remove prepended and trailing newlines/whitespace/etc
        rawLog.strip(" \r\n\t")

        self.lgr.debug('POST-PROCESSED LOG [[[ ' + rawLog + ' ]]] using ' + self.__str__())

        # get memory size of log - in bytes - and add to avg
        memSizeOfLog = getsizeof(rawLog)
        self.avgStat('average_log_size', self.stats['average_log_size'], memSizeOfLog)

        # get # of chars in log and add to avg
        self.avgStat('average_log_length', self.stats['average_log_length'], len(rawLog))

        # parse post-processed log
        if not self.parseLog(rawLog):
            self.incrStat('total_log_processing_failures', 1, True)
            return False

        # increase stat for total number of logs processed
        self.incrStat('total_logs_processed', 1, True)

        return True

    def pollLogFile(self, isTestRun=False):
        """
        Tails the log file for one log and processes it
        
        :param isTestRun: signifies if we're performing a test run or not
        :return: void
        """

        # fetch new log(s)
        try:
            # reset stat data
            runStats = {
                        'num_logs': 0,
                        'run_time': 0,
                        'logs_per_sec': 0
            }
            self.resetParserStats('last_run', runStats, False)

            runStartTime = datetime.datetime.utcnow()
            # NOTE: paranoid denotes updating the offset file after every log is read; statefullness is important ^_^
            for log in Pygtail(self.logFile, offset_file=self.offsetFile, paranoid=True):
                startTime = datetime.datetime.utcnow()

                # incr run stat
                self.stats['last_run']['num_logs'] += 1

                # try to process the log
                if self.processLog(log):
                    # log parsed successfully :)
                    self.lgr.debug('log successfully processed :: ' + self.__str__())

                    # break after parsing a single log if running a test run
                    if isTestRun:
                        self.lgr.debug('configured as a test run, ceasing parsing')
                        break
                else:
                    # log processing failed :(
                    self.lgr.warning('could not process log :: '  + self.__str__() + ' :: [ ' + log + ' ]')

                    # exit w/ error if we're running a test run
                    if isTestRun:
                        self.lgr.debug('configured as a test run, we should exit')
                        exit(1)
                endTime = datetime.datetime.utcnow()

                # calculate processing time for log
                logProcessingTime = endTime - startTime

                # update LPS stat
                self.avgStat('average_log_processing_time', self.stats['average_log_processing_time'],
                             logProcessingTime.microseconds)
            runEndTime = datetime.datetime.utcnow()

            # update last run time stat
            runTime = runEndTime - runStartTime
            self.stats['last_run']['run_time'] = runTime.seconds or 1
            # the or operation above usually happens during the first run; defaults to 1s

            # calc LPS
            self.stats['last_run']['logs_per_sec'] = self.stats['last_run']['num_logs'] / \
                                                     self.stats['last_run']['run_time']

            # print run stats
            self.lgr.debug('|-- PARSER STATS - PER RUN --| :: ' + self.__str__() + ' :: '
                          + self.printStats(runSpecific=True))

        except FileNotFoundError as e:
            self.lgr.error('could not open file for parser :: ' + self.__str__() + ' :: [ MSG: ' + str(e) + ' ]')
        except PermissionError as e:
            self.lgr.error('permission denied when trying to access target log file :: ' + self.__str__() + ' :: [ MSG: '
                           + str(e) + ' ]')
        except UnicodeDecodeError as e:
            self.lgr.error('content with invalid formatting found in target log file :: ' + self.__str__() + ' :: [ MSG: '
                           + str(e) + ' ]')

    def __str__(self):
        """
        Print metadata as a string
        
        :return: str
        """

        return '[ PARSER ID: ' + str(self.parserID) + ' // NAME: ' + self.parserName + ' // READING FROM LOG FILE: ' \
               + self.logFile + ' // OFFSET FILE: ' + self.offsetFile + ' ]'

