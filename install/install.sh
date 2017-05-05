#!/usr/bin/env bash

# =======================================
# Install.sh
# Automated installer for Inquisition
# v1.0
# =======================================

function createDirStructure()
{
    # create directories
    echo "Creating application directory @ [ $1 ]..."
    mkdir $1 > /dev/null 2>&1
    echo "Creating application subdirectories..."
    echo "tmp/"
    mkdir $1'/tmp/' > /dev/null 2>&1
    echo "Creating log directory @ [ $2 ]..."
    mkdir $2 > /dev/null 2>&1
}

function syncAppFiles()
{
    # copy files to app dir
    echo "Syncing application files to [ $1 ]..."
    rsync -av --exclude 'build' --exclude 'install' --exclude '.travis.yml' ./* $1 || exit 1
}

function runBuildPrep()
{
    # run all steps needed to prep for build test
    echo "Running build prep..."
    TEST_LOG_DIR="$2/test_logs/"
    echo "Using [ $TEST_LOG_DIR ] for storing sample logs"

    # update directory perms
    mkdir $TEST_LOG_DIR > /dev/null 2>&1
    chown -R travis $1
    chmod -R 774 $1
    chown -R travis $TEST_LOG_DIR
    chmod -R 774 $TEST_LOG_DIR

    # create and xfer test/sample log files
    sudo touch /var/log/inaccessible_test_log
    sudo chmod 600 /var/log/inaccessible_test_log
    cp -rf build/src/sample_logs/* $TEST_LOG_DIR
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
    echo "Import table schema..."
    mysql -u root $2 inquisition < $TABLE_SCHEMA || exit 1
}

# MAIN
BUILD_FLAG=0
MYSQL_PASS_FLAG=''
MYSQL_TABLE_SCHEMA_FILE='install/src/inquisition.sql'
APP_DIR='/opt/inquisition'
LOG_DIR='/var/log/inquisition'

# check if this is a build or not (build don't require MySQL passwords
while test $# -gt 0
do
    case "$1" in
        --is-build)
            BUILD_FLAG=1
            MYSQL_TABLE_SCHEMA_FILE='build/src/inquisition.sql'
            ;;
        *)
            echo "UNKNOWN ARGUMENT :: [ $1 ]"
            ;;
    esac
    shift
done

echo "[ STARTING INSTALL ]"

# create directories
createDirStructure $APP_DIR $LOG_DIR

# sync files to app folder
syncAppFiles $APP_DIR

# run build prep if needed
if [ $BUILD_FLAG == 1 ]
then
    runBuildPrep $LOG_DIR
else
    # password is needed for accessing db
    MYSQL_PASS_FLAG='-p'
fi

# init inquisition database
initializeInquisitionDb $MYSQL_TABLE_SCHEMA_FILE $MYSQL_PASS_FLAG

# setup log db
redis-cli set log_id 0 || (echo "COULD NOT CONNECT TO REDIS!" && exit 1)

echo "[ INSTALL COMPLETE! ]"

exit 0