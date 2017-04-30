# Inquisition
[![Documentation Status](https://readthedocs.org/projects/inquisition-siem/badge/?version=latest)](http://inquisition-siem.readthedocs.io/en/latest/?badge=latest)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/528dcd48a63f4ca0b321814d4577aa52)](https://www.codacy.com/app/magneticstain/Inquisition?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=magneticstain/Inquisition&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/magneticstain/Inquisition/badge.svg?branch=master)](https://coveralls.io/github/magneticstain/Inquisition?branch=master)
[![Build Status](https://travis-ci.org/magneticstain/Inquisition.svg?branch=master)](https://travis-ci.org/magneticstain/Inquisition)
[![Stories in Ready](https://badge.waffle.io/magneticstain/Inquisition.svg?label=ready&title=Ready)](http://waffle.io/magneticstain/Inquisition)

An advanced and versatile open-source SIEM platform

# Introduction
Inquisition utilizes three pieces of software in order to analyze your environments logs and generate security events
that you **actually** want to know about.

**Anatomize.py** scans and parses your log files and sticks them in an in-memory log store for further analysis.

**Destiny.py** utilizes machine-learning (TensorFlow) in order to analyze the log store and generate new security events.

**Celestial** provides a front-end web GUI and API for managing your Inquisition install, responding to events, and receiving
awareness of the security of your environment.

# Installation
Installation of Inquisition is easy: install the requirements, install the software, and run through setup for your environment

## Requirements
### Required Software
Inquisition requires the following software in order to run properly:

#### Databases
* MySQL 5.4<=
* Redis (latest)

#### Interpreters
* Python 3+
* PHP 5.4<=

#### Plugins
* PyMySQL
* redis-py
* pygtail ( https://pypi.python.org/pypi/pygtail )

### Install Requiremed Software
To install the required software, you can follow the instructions below. These instructions should work on both Debian-based
and CentOS-based OS's:

#### Third-Party Software and Interpreters
* MySQL: [Debian](https://www.linode.com/docs/databases/mysql/how-to-install-mysql-on-debian-7) | [CentOS](https://www.linode.com/docs/databases/mysql/how-to-install-mysql-on-centos-7)
* Redis: [Redis Quick Start (all OS's)](https://redis.io/topics/quickstart)
* Python 3: [Debian](https://www.digitalocean.com/community/tutorials/how-to-install-python-3-and-set-up-a-local-programming-environment-on-debian-8) | [CentOS](https://www.digitalocean.com/community/tutorials/how-to-install-python-3-and-set-up-a-local-programming-environment-on-centos-7)
* PHP: [Debian](http://php.net/manual/en/install.unix.debian.php) | [CentOS](http://dev.antoinesolutions.com/php)

#### Plugins
##### Python
Installing the required python pluging is easy with pip:
```bash
root@localhost ~ $ pip3 install -r requirements.txt
```

## Install Inquisition
To install the Inquisition software, perform the following.

CD to the install directory:
```bash
root@localhost ~ $ cd ~/InquisitionFiles/install/
```

Run the installation script and follow the prompts:
```bash
root@localhost ~/InquisitionFiles/install/ $ ./install.sh
```

# Usage
After installing the software, we're now ready to start using it. To start Inquisition, run inquisition.py with the application
config file provided as a parameter.
```bash
root@localhost ~ $ /opt/inquisition/inquisition.py -c /opt/inquisition/conf/main.cfg 
```

That will start the main inquisition process and fork off each subprocess in order to perform its repective role. To stop
inquisition.py, we can simply issue a SIGTERM for the process and it will shutdown gracefully:
```bash
root@localhost ~ $ killall inquisition.py
```