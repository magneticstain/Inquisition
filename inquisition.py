#!/usr/bin/python3

"""
Inquisition.py

APP: Inquisition
DESC: The main running container for the Inquisition platform
CREATION_DATE: 2017-04-07

"""

# MODULES
# | Native
import argparse, configparser
from os import path

# | Third-Party
import raven

# | Custom
from lib.inquisit.Inquisit import Inquisit
from lib.anatomize.Anatomize import Anatomize
from lib.destiny.Erudite import Erudite
from lib.destiny.Sage import Sage
from lib.destiny.Augur import Augur

# METADATA
__author__ = 'Joshua Carlson-Purcell'
__license__ = 'MIT'
__version__ = '2019.0.0.1-alpha'
__maintainer__ = 'Joshua Carlson-Purcell'
__email__ = 'jcarlson@carlso.net'
__status__ = 'Development'


# FUNCTIONS
def parseCliArgs():
    """
    Parse CLI arguments

    :return: post-parsing ArgumentParser() obj
    """

    # set CLI arguments
    cliParser = argparse.ArgumentParser(description='An advanced and versatile open-source SIEM platform')
    cliParser.add_argument('-c', '--config-file', help='Configuration file to be used')
    cliParser.add_argument('-k', '--config-check', action='store_true',
                           help='Try running Inquisition up to right after the configs are read in and parsed',
                           default=False)
    cliParser.add_argument('-t', '--test-run', action='store_true',
                           help='Run Inquisition in test mode (read-only, debug-level logs, single processes)',
                           default=False)
    cliParser.add_argument('-l', '--max-logs-to-parse',
                           help='The maximum number of logs to parse before the parser dies', default=-1)

    # read in args
    return cliParser.parse_args()

def parseConfigFile(configFile):
    """
    Parse App Configuration from File

    :param configFile: filename of configuration file to read in
    :return: configparser.ConfigParser()
    """

    # create CP object
    cfg = configparser.ConfigParser()

    # check if config file is readable
    if configFile:
        if path.isfile(configFile):
            # ingest and return configuration
            cfg.read(configFile)
        else:
            print('[CRIT] config file not found :: [', configFile, ']')

            exit(1)

    return cfg

def generateCfg():
    """
    Generate master config set from CLI and config file values

    :return: dict
    """

    # read in CLI params
    cliArgs = parseCliArgs()

    # read in config file
    cfg = None
    try:
        cfg = parseConfigFile(cliArgs.config_file)
    except ImportError as err:
        print('[CRIT] configparser module not available\n\nDETAILS:\n', err)

        exit(1)
    except configparser.Error as err:
        print('[CRIT] could not parse config file :: [', cliArgs.config_file, ']\n\nDETAILS:\n', err.message)

        exit(1)

    # convert cli args format to config file format and combine them
    # NOTE: for some reason, all values must be strings with the configparser library
    cfg.add_section('cli')
    cfg['cli']['config_check'] = str(cliArgs.config_check)
    cfg['cli']['test_run'] = str(cliArgs.test_run)

    # check if any CLI args overlap with config file options (CLI wins)
    if int(cliArgs.max_logs_to_parse) >= 0:
        # max logs set by cli, override config file val
        if not cfg.has_section('parsing'):
            cfg.add_section('parsing')

        cfg['parsing']['maxLogsToParse'] = cliArgs.max_logs_to_parse

    return cfg

def main():
    """
    Main runtime module

    :return: void
    """

    # read in config file
    cfg = generateCfg()

    # start local logger
    lgr = Inquisit.generateLogger(cfg, __name__)
    lgr.info('starting inquisition.py...')

    # create Sentry client for debugging (if API key is available)
    sentryClient = None
    try:
        sentryApiKey = cfg['debug']['sentry_api_key']
    except KeyError:
        sentryApiKey = ''
    if sentryApiKey:
        # API key provided, initialize client
        sentryClient = raven.Client(
            dsn='https://' + sentryApiKey + '@sentry.io/174245',
            release=raven.fetch_git_sha(path.dirname(__file__))
        )

    # initialize subroutine instances
    anatomize = Anatomize(cfg, sentryClient)
    erudite = Erudite(cfg, sentryClient)
    sage = Sage(cfg, sentryClient)
    augur = Augur(cfg, sentryClient)

    if not cfg.getboolean('cli', 'config_check'):
        # start log polling/parsing
        anatomize.startAnatomizer()

        # begin fetching OSINT data for threat detection engine
        augur.fetchIntelData()

        # start log anomaly engine (Erudite)
        erudite.startAnomalyDetectionEngine()

        try:
            baselineMode = cfg.getboolean('learning', 'enableBaselineMode')
        except (configparser.NoSectionError, configparser.NoOptionError, KeyError):
            baselineMode = False
        if not baselineMode:
            # not running in baseline mode; start network threat detection engine
            # network threat engine (Sage)
            sage.startNetworkThreatEngine()
        else:
            lgr.info('running in baseline mode, not running network threat analysis engine (Sage)')
    else:
        msg = 'configuration check is [ SUCCESSFUL ], exiting...'
        print('[INFO] ' + msg)
        lgr.info(msg)

    lgr.debug('exiting inquisition.py bootstrapper')


if __name__ == '__main__':
    main()