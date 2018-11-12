# Inquisition
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/528dcd48a63f4ca0b321814d4577aa52)](https://www.codacy.com/app/magneticstain/Inquisition?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=magneticstain/Inquisition&amp;utm_campaign=Badge_Grade)
[![Maintainability](https://api.codeclimate.com/v1/badges/1ea690d01f5ee5f1ec88/maintainability)](https://codeclimate.com/github/magneticstain/Inquisition/maintainability)
[![Coverage Status](https://coveralls.io/repos/github/magneticstain/Inquisition/badge.svg?branch=master)](https://coveralls.io/github/magneticstain/Inquisition?branch=master)
[![Build Status](https://travis-ci.org/magneticstain/Inquisition.svg?branch=master)](https://travis-ci.org/magneticstain/Inquisition)
[![Stories in Ready](https://badge.waffle.io/magneticstain/Inquisition.svg?label=ready&title=Ready)](http://waffle.io/magneticstain/Inquisition)

An advanced and versatile network anomaly detection platform for SMB and enterprise alike.

** Currently a work-in-progress **

# Introduction
Inquisition utilizes three pieces of software in order to analyze your environment's logs and generate security alerts
that you **actually** want to know about.

**Anatomize.py** scans and parses your log files and sticks them in an in-memory log store for further analysis.

**Destiny** utilizes machine-learning (via the SciKit library) in order to analyze the log store and identify anomalous events.

**Celestial** provides a front-end web GUI and API for managing your Inquisition install, receiving and responding to alerts, and 
overeseeing the security of your environment.

## What Does Inquisition Help Identify
Since it specifically identifies anomalous network events, Inquisition specializes in alerting on security issues such as:
* Data Exfiltration
* Current Breaches
* Active APT Attacks
* Widespread malware infections (especially RAT's and trojans)

# Installation
Installation of Inquisition is easy: install the requirements, install the software, and run through setup for your environment.

You can find instructions on how to install Inquisition by visiting the [installation guide](https://github.com/magneticstain/Inquisition/wiki/Installing-Inquisition) page in the project wiki.

# Usage
After installing the software, we're now ready to start using it. For information on how to use Inquisition, visit the [user guide](https://github.com/magneticstain/Inquisition/wiki/Inquisition-User-Guide).

# Credits
## Third-Party Libraries
* [pygtail](https://github.com/bgreenlee/pygtail)
* [predis](https://github.com/nrk/predis)
* [Chart.js](https://www.chartjs.org/docs/latest/)
* [jquery-cookie](https://github.com/carhartl/jquery-cookie)
* [timeago](https://timeago.yarp.com/)
* [PACE](https://github.hubspot.com/pace/docs/welcome/)
* [jquery-toggles](https://github.com/simontabor/jquery-toggles)
* [vex](https://github.hubspot.com/vex/)