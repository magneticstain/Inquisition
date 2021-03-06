#!/usr/bin/env bash

# =======================================
# Install.sh
# Automated installer for Inquisition
# v1.0
# =======================================

function createServiceAccts()
{
    # create service accounts (including matching grp) for applications to run under
    echo "Configuring application service account..."
    if ! grep '^inquisition:' /etc/passwd > /dev/null 2>&1
    then
        /usr/sbin/useradd -r inquisition > /dev/null 2>&1 || "[ ERROR ] could not create app service account"
    else
        echo "Service account already present, skipping..."
    fi
}

function createDirStructure()
{
    APP_DIR=$1
    if [ -z "$APP_DIR" ]
    then
       APP_DIR='/opt/inquisition/'
    fi
    LOG_DIR=$2
    if [ -z "$LOG_DIR" ]
    then
        LOG_DIR='/var/log/inquisition/'
    fi

    # create directories
    if [ ! -d "$APP_DIR" ]
    then
        echo "Creating application directory @ [ $APP_DIR ]..."
        mkdir $APP_DIR > /dev/null 2>&1 || (echo "[ ERROR ] could not create app directory; try checking permissions" && exit 1)
        echo "Creating application subdirectories..."
        echo "tmp/"
        mkdir $APP_DIR'/tmp/' > /dev/null 2>&1
    fi
    if [ ! -d "$LOG_DIR" ]
    then
        echo "Creating log directory @ [ $LOG_DIR ]..."
        mkdir $LOG_DIR || (echo "[ ERROR ] could not create log directory; try checking permissions" && exit 1)
    fi
}

function syncAppFiles()
{
    # add params to rsync cmd if upgrade
    # params will prevent transferring config files from source
    CONF_EXCLUDE_PARAM=""
    if [ "$2" -eq 1 ]
    then
        # DEV NOTE: for some reason, wrapping 'conf' in quotes will cause bash to escape those quotes, causing rsync to
        # fail to actually exclude the dir
        CONF_EXCLUDE_PARAM="--exclude conf"
    fi

    # copy files to app dir
    echo "Syncing application files to [ $1 ]..."
    rsync -av $CONF_EXCLUDE_PARAM --exclude 'build' --exclude 'install' --exclude '.travis.yml' --exclude 'web/tests' --exclude 'composer.*' --exclude 'phpunit.xml' --exclude 'requirements.txt' ./* $1 || exit 1

    # set perms
    echo "Setting file permissions..."
    chown -R inquisition:inquisition "$APP_DIR" "$LOG_DIR" > /dev/null 2>&1 || (echo '[ ERROR ] could not set file permissions' && exit 1)

    # allow web access to config files
    chgrp -R www-data $APP_DIR'/conf/'
    chmod 755 $APP_DIR'/conf/'
    chmod 660 $APP_DIR'/conf/main.cfg' $APP_DIR'/conf/min.cfg'
}

function runBuildPrep()
{
    # run all steps needed to prep for build test
    echo "Running build prep..."
    TEST_LOG_DIR="$2/test_logs/"
    echo "Using [ $TEST_LOG_DIR ] for storing sample logs"

    # create and xfer test/sample log files
    sudo touch /var/log/inaccessible_test_log
    sudo chmod 600 /var/log/inaccessible_test_log
    mkdir $TEST_LOG_DIR > /dev/null 2>&1
    cp -rf build/src/sample_logs/* $TEST_LOG_DIR

    # update directory perms
    chown -R travis $1 $2 $TEST_LOG_DIR
    chmod -R 777 $1 $2 $TEST_LOG_DIR
}

function initializeInquisitionDb()
{
    # check for schema file
    if [ ! -z $1 ]
    then
        # schema file specified
        TABLE_SCHEMA=$1
    else
        # no schema file set, use default
        TABLE_SCHEMA='install/src/inquisition.sql'
    fi

    # initialize the database for Inquisition
    echo "Initializing database..."
    mysql -u root $2 -e "CREATE DATABASE inquisition"
    echo "Creating DB service account..."
    mysql -u root $2 -e "CREATE USER inquisition@'localhost' IDENTIFIED BY ''; GRANT SELECT,INSERT,UPDATE,DELETE ON inquisition.* TO inquisition@'localhost'; FLUSH PRIVILEGES"
    echo "Importing table schema..."
    mysql -u root $2 inquisition < $TABLE_SCHEMA || exit 1
}

# MAIN
BUILD_FLAG=0
STANDALONE_INSTALL_FLAG=0
UPGRADE_FLAG=0
MYSQL_PASSWD_PARAM=''
MYSQL_TABLE_SCHEMA_FILE='install/src/inquisition.sql'
APP_DIR='/opt/inquisition'
LOG_DIR='/var/log/inquisition'

# check if this is a build or not
while test $# -gt 0
do
    case "$1" in
        --is-build)
            BUILD_FLAG=1
            MYSQL_TABLE_SCHEMA_FILE="build/src/inquisition.sql"
            ;;
        -S|--standalone)
            STANDALONE_INSTALL_FLAG=1
            ;;
        -U|--upgrade)
            UPGRADE_FLAG=1
            ;;
        *)
            echo "UNKNOWN ARGUMENT :: [ $1 ]"
            ;;
    esac

    shift
done

echo "[ STARTING INSTALL ]"

# prep install and sync files
createServiceAccts
createDirStructure "$APP_DIR" "$LOG_DIR"
syncAppFiles "$APP_DIR" "$UPGRADE_FLAG"

# run build prep if needed
if [ $BUILD_FLAG == 1 ]
then
    runBuildPrep "$APP_DIR" "$LOG_DIR"
else
    # password is needed for accessing db
    MYSQL_PASSWD_PARAM='-p'
fi

# init inquisition database if needed
if [ $BUILD_FLAG == 1 ] || [ $STANDALONE_INSTALL_FLAG == 1 ]
then
    initializeInquisitionDb "$MYSQL_TABLE_SCHEMA_FILE" "$MYSQL_PASSWD_PARAM"

    # check log db
    redis-cli ping || (echo "[ ERROR ] could not connect to Redis" && exit 1)
fi

# copy over logrotate manifest
echo "Generating log rotation config..."
/bin/cp -f install/src/inquisition_logrotate_manifest /etc/logrotate.d/inquisition

echo "[ INSTALL COMPLETE! ]"

exit 0