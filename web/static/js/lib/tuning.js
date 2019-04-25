/*
    Inquisition // Celestial // Tuning.js

    - JS lib for tuning-related functionality, i.e. all data within tuning submodule of the UI
 */

'use strict';

var Tuning = function () {
    Module.call(this);
};

Tuning.getAllAppConfigOpts = function (cfgData) {
    /*
        Provide dataset of all application configuration options for every module
     */

    return {
        'parsing': [
            {
                inputType: 'number',
                label: 'Sleep Time',
                desc: 'Amount of time (in seconds) a parser should sleep for between checks for new logs/data (default: 2)',
                dataType: 'cfg',
                section: 'parsing',
                key: 'sleepTime',
                rawVal: cfgData.parsing.sleepTime
            },
            {
                inputType: 'number',
                label: 'Num Sleeps Between Stat Logging',
                desc: 'Number of sleeps the parser should go through before printing general stats in log (default: 10)',
                dataType: 'cfg',
                section: 'parsing',
                key: 'numSleepsBetweenStats',
                rawVal: cfgData.parsing.numSleepsBetweenStats
            },
            {
                inputType: 'number',
                label: 'Log TTL',
                desc: 'Amount of time (in seconds) to store logs in the Log DB',
                dataType: 'cfg',
                section: 'parsing',
                key: 'logTTL',
                rawVal: cfgData.parsing.logTTL
            },
            {
                inputType: 'number',
                label: 'Max Logs To Parse',
                desc: 'Number of logs a parser should read before exiting. If set to 0, the parser will ' +
                'interactively read from the log file as new logs are written. (default: 0)',
                dataType: 'cfg',
                section: 'parsing',
                key: 'maxLogsToParse',
                rawVal: cfgData.parsing.maxLogsToParse
            },
            {
                inputType: 'toggle',
                label: 'Hazy Tracking',
                desc: 'If set to true, it enables a feature that reduces state tracking accuracy in return for increased ' +
                'parsing speed. See Inquisition docs for more details (default: F [DISABLED])',
                dataType: 'cfg',
                section: 'state_tracking',
                key: 'enableHazyStateTracking',
                rawVal: cfgData.state_tracking.enableHazyStateTracking
            },
            {
                inputType: 'number',
                label: 'Num Logs Between State Updates',
                desc: 'If hazy state tracking is enabled, this is the amount of logs a parser will wait before updating ' +
                'the offset file (default: 5)',
                dataType: 'cfg',
                section: 'state_tracking',
                key: 'stateTrackingWaitNumLogs',
                rawVal: cfgData.state_tracking.stateTrackingWaitNumLogs
            }
        ],
        'analysis': [
            {
                inputType: 'toggle',
                label: 'Baseline Mode',
                desc: 'Enable/disable baseline mode. In baseline mode, the Destiny engine is set to learn about the ' +
                'network it\'s on, i.e. it "baselines" the network to know what\'s NOT a threat. See the user manual ' +
                'for more details. (default: 0 [DISABLED])',
                dataType: 'cfg',
                section: 'learning',
                key: 'enableBaselineMode',
                rawVal: cfgData.learning.enableBaselineMode
            },
            {
                inputType: 'number',
                label: 'Sleep Time (Threat Detection)',
                desc: 'Amount of time (in seconds) to wait between running threat detection runs on current log data.' +
                ' (default: 15)',
                dataType: 'cfg',
                section: 'learning',
                key: 'networkThreatDetectionSleepTime',
                rawVal: cfgData.learning.networkThreatDetectionSleepTime
            },
            {
                inputType: 'number',
                label: 'Sleep Time (Anomaly Detection)',
                desc: 'Amount of time (in seconds) to wait between running network anomaly detection runs on current ' +
                'log data. (default: 5)',
                dataType: 'cfg',
                section: 'learning',
                key: 'anomalyDetectionSleepTime',
                rawVal: cfgData.learning.anomalyDetectionSleepTime
            },
            {
                inputType: 'float',
                label: 'Max Standard Deviation Tolerance',
                desc: 'Maximum standard deviation that Erudite can detect in active log amounts before generating ' +
                'alert. (default: 1.0)',
                dataType: 'cfg',
                section: 'alerting',
                key: 'maxTrafficNodeStdDev',
                rawVal: cfgData.alerting.maxTrafficNodeStdDev
            }
        ],
        'ioc': [
            {
                inputType: 'number',
                label: 'Sleep Time',
                desc: 'Amount of time (in seconds) that Augur will wait before fetching IOC data. (default: 3600)',
                dataType: 'cfg',
                section: 'intel',
                key: 'sleepTime',
                rawVal: cfgData.intel.sleepTime
            }
        ],
        'general': [
            {
                inputType: 'text',
                label: 'App. Log File',
                desc: 'Filename to write application logs to. (default: /var/log/inquisition/app.log)',
                dataType: 'cfg',
                section: 'logging',
                key: 'logFile',
                rawVal: cfgData.logging.logFile
            },
            {
                inputType: 'text',
                label: 'App. Logging Level',
                desc: 'Minimum level of logging to write to disk. For example, a setting of \'ERROR\' will write logs ' +
                'with a severity level of ERROR and CRITICAL. (DEBUG|INFO|WARNING|ERROR|CRITICAL) (default: INFO)',
                dataType: 'cfg',
                section: 'logging',
                key: 'logLvl',
                rawVal: cfgData.logging.logLvl
            },
            {
                inputType: 'text',
                label: 'App. Log Format Template',
                desc: 'Formatting of logs being written. More info on formatting syntax can be found in the ' +
                'documentation for the logging library in Python. ' +
                '(default: %(asctime)s [ %(levelname)s ] [ %(name)s ] %(message)s',
                dataType: 'cfg',
                section: 'logging',
                key: 'logFormat',
                rawVal: cfgData.logging.logFormat
            },
            {
                inputType: 'toggle',
                label: 'Metrics Mode',
                desc: 'If enabled, write stat for run-based stats at the INFO level instead of DEBUG level. ' +
                '(default: F [DISABLED])',
                dataType: 'cfg',
                section: 'logging',
                key: 'enableMetricsMode',
                rawVal: cfgData.logging.enableMetricsMode
            },
            {
                inputType: 'toggle',
                label: 'Print Template Match',
                desc: 'Specifies whether parser should write the values its templates match in the log. ' +
                'This should be disabled if you are parsing sensitive information in your logs or are must abide by ' +
                'various compliance frameworks (e.g. PCI, w/ credit card data in the logs). (default: T [ENABLED])',
                dataType: 'cfg',
                section: 'logging',
                key: 'printMatchValues',
                rawVal: cfgData.logging.printMatchValues
            },
            {
                inputType: 'toggle',
                label: 'Verbose Logging',
                desc: 'Specifies whether parser should write ALL data it processes to logs. Usually only useful for ' +
                'debugging or compliance. (default: F [DISABLED]',
                dataType: 'cfg',
                section: 'logging',
                key: 'verbose',
                rawVal: cfgData.logging.verbose
            },
            {
                inputType: 'toggle',
                label: 'Store Stats Persistently',
                desc: 'If set to true, store stat data in the Log DB for easy and persistent access. ' +
                '(default: T [ENABLED])',
                dataType: 'cfg',
                section: 'stats',
                key: 'keepPersistentStats',
                rawVal: cfgData.stats.keepPersistentStats
            }
        ]
    };
};

// Loading Functs
Tuning.prototype.generateAppCfgOptHTML = function (configOptData) {
    /*
        Generate HTML for application configuration options

        NOTES:
            * configOptData entries should match format of:
                * inputType (text, number, toggle)
                * label
                * description
                * dataType
                * section
                * key
                * rawVal
     */

    if(configOptData == null)
    {
        throw 'no configuration option data provided for config HTML generation';
    }

    var toggleDataAttr = '',
        optCount = 0,
        html = '' +
        '<table>' +
        '   <tr>';

    // traverse app config opt dataset
    configOptData.forEach(function (configOpt) {
        optCount++;

        // add config label
        html += '' +
            '<td>' +
            '   <span class="configOptLabel" title="' + configOpt.desc + '">' + configOpt.label + '</span>' +
            '</td>' +
            '<td>';

        // generate config opt value html
        var configMetadataAttrs = 'data-datatype="' + configOpt.dataType + '" data-section="' + configOpt.section
            + '" data-key="' + configOpt.key + '"';
        if(configOpt.inputType === 'toggle')
        {
            // set class for toggle(s) based on value
            if(parseInt(configOpt.rawVal) === 1)
            {
                toggleDataAttr = 'data-toggle-on="true"';
            }

            html += '<div ' + configMetadataAttrs + ' ' + toggleDataAttr + ' class="toggleSwitch toggle-modern ' +
                'configValInputs"></div>';
        }
        else
        {
            var addlElmntAttrs = '';
            if(configOpt.inputType === 'float')
            {
                configOpt.inputType = 'number';
                addlElmntAttrs = 'step="0.001"';
            }

            html += '<input class="configValInputs" ' + configMetadataAttrs + ' type="' + configOpt.inputType + '" ' +
                addlElmntAttrs + ' value="' + configOpt.rawVal + '">';
        }
        html += '</td>';

        // end table row every two configs OR if it's the last element in the series
        if(0 < optCount && (optCount % 2 === 0 || optCount === configOptData.length))
        {
            html += '</tr>';

            if(optCount !== configOptData.length)
            {
                // not the last element in the set, prep a new row
                html += '<tr>';
            }
        }
    });

    html += '</table>';

    return html;
};

Tuning.prototype.loadTuningConfiguration = function (tuningData, contentWrapper, titleHTML) {
    /*
        Load and display configuration to be tuned, along w/ current vals, to View for user to interact with
     */

    var tuningDataset = tuningData.data,
        appConfigOpts = Tuning.getAllAppConfigOpts(tuningDataset.cfg);

    // save tuning dataset for global access so that it can be used by all libs/functions
    Global.prototype.queryGlobalAccessData('set', 'tuning', 'tuning-dataset', tuningDataset);

    var contentHTML = titleHTML +
        '<div id="primaryContentData" class="contentModule">' +
        '   <div id="tuningOptsWrapper" class="moduleDataWrapper">' +
        '       <div class="optSetBundle">' +
        '           <h2 class="title subtitle">Parsing Options</h2>' +
        '           <div class="optWrapper configs">' +
        Tuning.prototype.generateAppCfgOptHTML(appConfigOpts.parsing) +
        '           </div>' +
        '           <div class="optWrapper">' +
        ConfigTable.prototype.getConfigTableHTML('template', tuningDataset.template) +
        '           </div>' +
        '           <div class="optWrapper">' +
        ConfigTable.prototype.getConfigTableHTML('parser', tuningDataset.parser) +
        '           </div>' +
        '       </div>' +
        '       <div class="optSetBundle">' +
        '           <h2 class="title subtitle">Analysis Options</h2>' +
        '           <div class="optWrapper configs">' +
        Tuning.prototype.generateAppCfgOptHTML(appConfigOpts.analysis) +
        '           </div>' +
        '           <div class="optWrapper">' +
        ConfigTable.prototype.getConfigTableHTML('known_host', tuningDataset.known_host) +
        '           </div>' +
        '           <div class="optWrapper">' +
        '           </div>' +
        '       </div>' +
        '       <div class="optSetBundle">' +
        '           <h2 class="title subtitle">Intel Options</h2>' +
        '           <div class="optWrapper configs">' +
        Tuning.prototype.generateAppCfgOptHTML(appConfigOpts.ioc) +
        '           </div>' +
        '           <div class="optWrapper">' +
        ConfigTable.prototype.getConfigTableHTML('ioc_field_mapping', tuningDataset.ioc_field_mapping,
            tuningDataset.field) +
        '           </div>' +
        '       </div>' +
        '       <div class="optSetBundle">' +
        '           <h2 class="title subtitle">Application Configuration Options</h2>' +
        '           <div class="optWrapper configs">' +
        Tuning.prototype.generateAppCfgOptHTML(appConfigOpts.general) +
        '           </div>' +
        '       </div>' +
        '   </div>' +
        '</div>';

    // update content container with html data
    contentWrapper.html(contentHTML);
};

// Post-Load Functs
// App Configs
Tuning.prototype.initToggles = function (onToggleCallback) {
    /*
        Initialize all toggle buttons on current page
     */

    var toggleSwitches = $('.toggleSwitch');

    // init toggles via lib
    toggleSwitches.off().toggles();

    // add listener if needed
    if(onToggleCallback != null)
    {
        toggleSwitches.on('toggle', onToggleCallback);
    }
};

Tuning.prototype.serializeObjIfNeeded = function (inputData) {
    /*
        Check if given input data is an obj, and if so, serialize it
     */

    // DEV NOTE: null is actually an obj and is interpreted as such; https://stackoverflow.com/a/8511350
    if(typeof inputData === 'object' && inputData !== null)
    {
        inputData = JSON.stringify(inputData);
    }

    return inputData;
};

Tuning.prototype.updateConfigVal = function (dataType, section, identifier, key, val, method, callbackOnSuccess) {
    /*
        Send update for given configuration data to Tuning API
     */

    method = method || 'POST';

    // check if key or val needs to be serialized for sending via api
    // original value will be returned if a non-object is provided
    key = Tuning.prototype.serializeObjIfNeeded(key);
    val = Tuning.prototype.serializeObjIfNeeded(val);

    // send api request via mystic lib
    Mystic.queryAPI(method, '/api/v1/tuning/', 20000, {
        t: dataType,
        s: section,
        i: identifier,
        k: key,
        v: val
    }, function (apiResponse) {
        if(callbackOnSuccess != null)
        {
            // success callback function provided, lets run it
            callbackOnSuccess(apiResponse, dataType);
        }

        ErrorBot.generateError(-1, 'configuration updated successfully');
    }, function (apiResponse) {
        var apiError = '';
        if(apiResponse.error != null)
        {
            apiError = ' :: [ ' + apiResponse.error + ' ]';
        }

        ErrorBot.generateError(4, 'could not save configuration data via Inquisition API' + apiError);
    });
};

Tuning.prototype.startSaveTimeout = function (dataType, section, identifier, key, val) {
    /*
        Start timeout until we save all configuration options

        Addl. Info: timeout is currently hard-coded to 2000ms or 2s
     */

    var timeoutMS = 2000;

    // clear old timer, if appl.
    // TODO: confirm this works as expected in given context
    if(this.saveTimer)
    {
        clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(function () {
        Tuning.prototype.updateConfigVal(dataType, section, identifier, key, val);
    }, timeoutMS);
};

Tuning.prototype.appConfigHandler = function (elmnt, elmntType, isActive) {
    /*
        Handler for application configuration changes
     */

    var dataType = elmnt.data('datatype'),
        section = elmnt.data('section'),
        objIdentifier = elmnt.parents('.objContent').data('identifier'),
        key = elmnt.data('key'),
        rawConfigVal = elmnt.val();

    // convert bool to int to match API data reqs
    if(elmntType === 'toggle')
    {
        rawConfigVal = isActive === true ? 1 : 0;
    }

    Tuning.prototype.startSaveTimeout(dataType, section, objIdentifier, key, rawConfigVal);
};

Tuning.prototype.setConfigChangeTriggerEvts = function (useManualActionButtons) {
    /*
        Set all events needed for handling config changes
     */

    if(useManualActionButtons == null)
    {
        useManualActionButtons = false;
    }

    if(!useManualActionButtons)
    {
        // init toggle switches
        Tuning.prototype.initToggles(function (dataEvents, active) {
            Tuning.prototype.appConfigHandler($(this), 'toggle', active);
        });

        // input text boxes and other input elmnts
        $('.configValInputs:not(.toggleSwitch)').off().change(function () {
            Tuning.prototype.appConfigHandler($(this), 'input');
        });
    }
    else
    {
        // still init toggle switches so that they are shown in the view to the user
        // DEV NOTE: typically used when running this function during an ADD context
        Tuning.prototype.initToggles();
    }
};

Tuning.prototype.runPostConfigLoad = function () {
    /*
        Perform any logic needed for AFTER config data has been loaded into the view

        * intended to be ran after loadTuningConfiguration()
     */

    // init fuzzy timestamps
    Global.initFuzzyTimestamps();

    // add listeners for config changes
    Tuning.prototype.setConfigChangeTriggerEvts();

    // add listening for config data item blobs
    ConfigTable.prototype.initConfigItemHandlers();
};