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
    mkdir $APP_DIR > /dev/null 2>&1
    echo "Creating application subdirectories..."
    echo "tmp/"
    mkdir $APP_DIR'tmp/' > /dev/null 2>&1
    echo "Creating log directory..."
    mkdir $LOG_DIR > /dev/null 2>&1
}

function syncAppFiles()
{
    # copy files to app dir
    rsync -av --exclude 'build' --exclude 'install' --exclude '.travis.yml' ./* $APP_DIR || exit 1
}

function runBuildPrep()
{
    # run all steps needed to prep for build test
    # update directory perms
    mkdir $LOG_DIR'test_logs' > /dev/null 2>&1
    chown -R travis $LOG_DIR
    chmod -R 774 $LOG_DIR
    chown -R travis /var/log/inquisition/test_logs/
    chmod -R 774 /var/log/inquisition/test_logs/

    # create and xfer test/sample log files
    sudo touch /var/log/inaccessible_test_log
    sudo chmod 600 /var/log/inaccessible_test_log
    cp build/src/sample_logs/* /var/log/inquisition/test_logs/
}

function initializeInquisitionDb()
{
    # initialize the database for Inquisition
    echo "Initializing database..."
    mysql -u root $MYSQL_PASS_FLAG -e "CREATE DATABASE inquisition"
    echo "Creating DB service account..."
    mysql -u root $MYSQL_PASS_FLAG -e "CREATE USER inquisition@'localhost' IDENTIFIED BY ''; GRANT SELECT,INSERT,UPDATE,DELETE ON inquisition.* TO inquisition@'localhost'; FLUSH PRIVILEGES"
    echo "Import table schema..."
    mysql -u root $MYSQL_PASS_FLAG inquisition < $MYSQL_TABLE_SCHEMA_FILE || exit 1
}

BUILD_FLAG=0
MYSQL_PASS_FLAG=''
MYSQL_TABLE_SCHEMA_FILE='install/src/inquisition.sql'
APP_DIR='/opt/inquisition/'
LOG_DIR='/var/log/inquisition/'

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
createDirStructureAndFiles

# sync files to app folder
syncAppFiles

# run build prep if needed
if [ $BUILD_FLAG == 1 ]
then
    runBuildPrep
else
    # password is needed for accessing db
    MYSQL_PASS_FLAG='-p'
fi

# init inquisition database
initializeInquisitionDb

# setup log db
redis-cli set log_id 0 || (echo "COULD NOT CONNECT TO REDIS!" && exit 1)

echo "Installation complete!"

exit 0