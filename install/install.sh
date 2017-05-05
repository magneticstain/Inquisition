#!/usr/bin/env bash

# =======================================
# Install.sh
# Automated installer for Inquisition
# v1.0
# =======================================

function createDirStructure()
{
    # create directories
    echo "Creating application directory..."
    mkdir $1 > /dev/null 2>&1
    echo "Creating application subdirectories..."
    echo "tmp/"
    mkdir $1'/tmp/' > /dev/null 2>&1
    echo "Creating log directory..."
    mkdir $2 > /dev/null 2>&1
}

function syncAppFiles()
{
    # copy files to app dir
    rsync -av --exclude 'build' --exclude 'install' --exclude '.travis.yml' ./* $1 || exit 1
}

function runBuildPrep()
{
    # run all steps needed to prep for build test
    TEST_LOG_DIR="$2test_logs/"
    # update directory perms
    mkdir $TEST_LOG_DIR > /dev/null 2>&1
    chown -R travis $1
    chmod -R 774 $1
    chown -R travis $TEST_LOG_DIR
    chmod -R 774 $TEST_LOG_DIR

    # create and xfer test/sample log files
    sudo touch /var/log/inaccessible_test_log
    sudo chmod 600 /var/log/inaccessible_test_log
    cp build/src/sample_logs/* $TEST_LOG_DIR
}

function initializeInquisitionDb()
{
    # initialize the database for Inquisition
    echo "Initializing database..."
    mysql -u root $1 -e "CREATE DATABASE inquisition"
    echo "Creating DB service account..."
    mysql -u root $1 -e "CREATE USER inquisition@'localhost' IDENTIFIED BY ''; GRANT SELECT,INSERT,UPDATE,DELETE ON inquisition.* TO inquisition@'localhost'; FLUSH PRIVILEGES"
    echo "Import table schema..."
    mysql -u root $1 inquisition < $2 || exit 1
}

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
initializeInquisitionDb $MYSQL_PASS_FLAG $MYSQL_TABLE_SCHEMA_FILE

# setup log db
redis-cli set log_id 0 || (echo "COULD NOT CONNECT TO REDIS!" && exit 1)

echo "Installation complete!"

exit 0