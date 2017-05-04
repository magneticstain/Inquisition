#!/usr/bin/env bash

#
# Install.sh
# Automated installer for inquisition
# v1.0
#

# check if this is a build or not (build don't require MySQL passwords
if [ "$3" == "--is-build" ]
then
    BUILD_FLAG=1
else
    BUILD_FLAG=0
fi

APP_DIR='/opt/inquisition/'
LOG_DIR='/var/log/inquisition/'

# create directories
echo "Creating application directory..."
mkdir $APP_DIR > /dev/null 2>&1
echo "Creating application subdirectories..."
echo "tmp/"
mkdir $APP_DIR'tmp/' > /dev/null 2>&1
echo "Creating log directory..."
mkdir $LOG_DIR > /dev/null 2>&1

# copy files to app dir
rsync -av --exclude 'build' --exclude 'install' --exclude '.travis.yml' ../* $APP_DIR || exit 1

# provision db
if [ "$BUILD_FLAG" == "1" ]
then
    echo "Initializing database..."
    mysql -u root -e "CREATE DATABASE inquisition"
    echo "Creating DB service account..."
    mysql -u root -e "CREATE USER inquisition@'localhost' IDENTIFIED BY ''; GRANT SELECT,INSERT,UPDATE,DELETE ON inquisition.* TO inquisition@'localhost'; FLUSH PRIVILEGES"
    echo "Import table schema..."
    mysql -u root inquisition < ./src/inquisition.sql || exit 1
else
    echo "Initializing database..."
    mysql -u root -p -e "CREATE DATABASE inquisition"
    echo "Creating DB service account..."
    mysql -u root -p -e "CREATE USER inquisition@'localhost' IDENTIFIED BY ''; GRANT SELECT,INSERT,UPDATE,DELETE ON inquisition.* TO inquisition@'localhost'; FLUSH PRIVILEGES"
    echo "Import table schema..."
    mysql -u root -p  inquisition < ./src/inquisition.sql || exit 1
fi

# setup log db
redis-cli set log_id 0 || echo "COULD NOT CONNECT TO REDIS!" && exit 1

echo "Installation complete!"

exit 0