#!/usr/bin/env bash

#
# Inquisition Build Script
# - invokes build process in order to properly host Inquisition
#

APP_DIR='/opt/inquisition/'
LOG_DIR='/var/log/inquisition/'

# create directories
echo "Creating application directory..."
mkdir $APP_DIR > /dev/null 2>&1
echo "Creating log directory..."
mkdir $LOG_DIR > /dev/null 2>&1

# copy files to app dir
rsync -av --exclude 'build' --exclude '.travis.yml' ./* $APP_DIR

# provision db
echo "Initializing database..."
mysql -u root -e "create database inquisition"
echo "Creating DB service account..."
mysql -u root -e "GRANT SELECT,INSERT,UPDATE,DELETE ON inquisition.* TO inquisition@'localhost' IDENTIFIED BY ''"
mysql -u root -e "FLUSH PRIVILEGES"
echo "Import table schema..."
mysql -u root inquisition < build/src/inquisition.sql

# run any tests

echo "Build complete!"

exit 0