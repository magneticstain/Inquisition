/*
    Inquisition // Celestial // Tuning.js

    - JS lib for tuning-related functionality, i.e. all data within tuning submodule of the UI
 */

"use strict";

var Tuning = function () {};

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
                'parsing speed. See Inquisition docs for more details (default: 0 [ENABLED])',
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

            html += '<div ' + configMetadataAttrs + ' ' + toggleDataAttr + ' class="toggleSwitch toggle-modern"></div>';
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

Tuning.prototype.generateItemButtonHTML = function (addEditButton, addDeleteButton) {
    /*
        Generate HTML for item action buttons
     */

    var buttonHTML = '<span class="listingOptButtons">';

    if(addEditButton)
    {
        buttonHTML += '<img class="edit" src="/static/imgs/icons/edit.svg" title="Edit Configuration" ' +
            'alt="Open modal to edit configuration">';
    }

    if(addDeleteButton)
    {
        buttonHTML += '<img class="delete" src="/static/imgs/icons/delete.svg" title="Delete Item" ' +
            'alt="Delete this item permanently">';
    }

    buttonHTML += '</span>';

    return buttonHTML;
};

Tuning.prototype.generateItemBoxHTML = function (title, itemHTML) {
    /*
        Generate generic content box with given item html
     */

    return '' +
        '<h3 class="heading listingHeader">' + title + '</h3>' +
        '<div class="optSetListing">' +
        '   <div class="listingDataWrapper">' +
        '       <table class="listingData">' +
        itemHTML +
        '       </table>' +
        '   </div>' +
        '</div>';
};

Tuning.prototype.generateItemHTML = function (dataType, itemIdentifierFieldKey, itemFieldMetadata, itemData,
                                              requiredButtons, itemContentTitle) {
    /*
        Generate HTML of all given items using provided constraints
     */

    var itemHTML = '',
        titleCaseDataType = Global.normalizeTitle(dataType);

    if(itemContentTitle != null)
    {
        titleCaseDataType = Global.normalizeTitle(itemContentTitle);
    }

    // generate html for table header first
    itemHTML += '<tr>';
    itemFieldMetadata.forEach(function (field) {
        itemHTML += '<th>' + field.name + '</th>';
    });
    itemHTML += '' +
        '   <th>OPTIONS</th>' +
        '</tr>';

    itemData.forEach(function (item) {
        itemHTML += '<tr data-dataType="' + dataType + '" data-identifier="' + item[itemIdentifierFieldKey] + '">';
        
        // traverse each item and generate a cell for each data field
        itemFieldMetadata.forEach(function (itemField) {
            itemHTML += '<td>';
            switch (itemField.fieldType)
            {
                case 'general':
                    itemHTML += item[itemField.objKey];

                    break;
                case 'status':
                    var statusDisplayName = 'enabled',
                        statusHTMLChar = '&#10004;';
                    if(item.status == false)
                    {
                        statusDisplayName = 'disabled';
                        statusHTMLChar = '&#10008;';
                    }

                    itemHTML += '<span class="' + statusDisplayName + '" title="' + titleCaseDataType + ' is '
                        + statusDisplayName.toUpperCase() + '">' + statusHTMLChar + '</span>';

                    break;
                case 'timestamp':
                    itemHTML += '<time class="fuzzyTimestamp" title="' + item[itemField.objKey] + '" datetime="'
                        + item[itemField.objKey] + '"></time>';

                    break;
                case 'correlated':
                    // field value needs to be correlated w/ extra data
                    if(itemField.extraData == null)
                    {
                        throw 'no extra data provided for correlated item field';
                    }
                    var iocFieldName = 'UNKNOWN',
                        relatedData = itemField.extraData.data,
                        dataKey = itemField.extraData.sharedDataKey;

                    for(var i = 0; i < relatedData.length; i++)
                    {
                        if(relatedData[i][dataKey] === item[dataKey])
                        {
                            iocFieldName = relatedData[i][itemField.extraData.overwriteValKey];

                            break;
                        }
                    }

                    itemHTML += iocFieldName;

                    break;
                default:
                    throw 'unknown type found while generating item HTML :: [ ' + itemField.fieldType + ' ]';
            }
            itemHTML += '</td>';
        });

        // append button html
        itemHTML += '<td>' + Tuning.prototype.generateItemButtonHTML(requiredButtons.edit, requiredButtons.delete)
            + '</td>';

        itemHTML += '</tr>';
    });

    return this.generateItemBoxHTML(titleCaseDataType + 's', itemHTML);
};

Tuning.prototype.loadTuningConfiguration = function (onlyContent, tuningData, contentWrapper, titleHTML) {
    /*
        Load and display configuration to be tuned, along w/ current vals, to view for user to interact with
     */

    var tuningDataset = tuningData.data;
    var appConfigOpts = Tuning.getAllAppConfigOpts(tuningDataset.cfg);

    // save tuning dataset for global access so that it can be used by all libs/functions
    // $('#tuning').data('tuning-dataset');
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
        Tuning.prototype.generateItemHTML('template', 'template_id', [
            {
                name: 'status',
                fieldType: 'status',
                isIdentifier: false,
                objKey: 'status'
            },
            {
                name: 'id',
                fieldType: 'general',
                isIdentifier: true,
                objKey: 'template_id'
            },
            {
                name: 'created',
                fieldType: 'timestamp',
                isIdentifier: false,
                objKey: 'created'
            },
            {
                name: 'name',
                fieldType: 'general',
                isIdentifier: false,
                objKey: 'template_name'
            }
        ], tuningDataset.template, { edit: true, delete: true }) +
        '           </div>' +
        '           <div class="optWrapper">' +
        Tuning.prototype.generateItemHTML('parser', 'parser_id', [
            {
                name: 'status',
                fieldType: 'status',
                isIdentifier: false,
                objKey: 'status'
            },
            {
                name: 'id',
                fieldType: 'general',
                isIdentifier: true,
                objKey: 'parser_id'
            },
            {
                name: 'created',
                fieldType: 'timestamp',
                isIdentifier: false,
                objKey: 'created'
            },
            {
                name: 'name',
                fieldType: 'general',
                isIdentifier: false,
                objKey: 'parser_name'
            },
            {
                name: 'log',
                fieldType: 'general',
                isIdentifier: false,
                objKey: 'parser_log'
            }
        ], tuningDataset.parser, { edit: true, delete: true }) +
        '           </div>' +
        '       </div>' +
        '       <div class="optSetBundle">' +
        '           <h2 class="title subtitle">Analysis Options</h2>' +
        '           <div class="optWrapper configs">' +
        Tuning.prototype.generateAppCfgOptHTML(appConfigOpts.analysis) +
        '           </div>' +
        '           <div class="optWrapper">' +
        Tuning.prototype.generateItemHTML('known_host', 'host_id', [
            {
                name: 'id',
                fieldType: 'general',
                isIdentifier: true,
                objKey: 'host_id'
            },
            {
                name: 'created',
                fieldType: 'timestamp',
                isIdentifier: false,
                objKey: 'created'
            },
            {
                name: 'host',
                fieldType: 'general',
                isIdentifier: false,
                objKey: 'host_val'
            }
        ], tuningDataset.known_host, { edit: false, delete: true }) +
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
        Tuning.prototype.generateItemHTML('ioc_field_mapping', 'mapping_id', [
            {
                name: 'id',
                fieldType: 'general',
                isIdentifier: true,
                objKey: 'mapping_id'
            },
            {
                name: 'ioc item name',
                fieldType: 'general',
                isIdentifier: false,
                objKey: 'ioc_item_name'
            },
            {
                name: 'mapped field name',
                fieldType: 'correlated',
                isIdentifier: false,
                objKey: 'field_id',
                extraData: {
                    data: tuningDataset.field,
                    sharedDataKey: 'field_id',
                    overwriteValKey: 'field_name'
                }
            }
        ], tuningDataset.ioc_field_mapping, { edit: true, delete: true }) +
        // Tuning.prototype.generateIntelIOCListingHTML(tuningDataset.ioc_field_mapping, tuningDataset.field) +
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
Tuning.prototype.initToggles = function (onToggleCallback) {
    /*
        Initialize all toggle buttons on current page
     */

    var toggleSwitches = $('.toggleSwitch');

    // init toggles via lib
    toggleSwitches.toggles();

    // add listener if needed
    if(onToggleCallback != null)
    {
        toggleSwitches.on('toggle', onToggleCallback);
    }
};

Tuning.prototype.setConfigChangeTriggerEvts = function () {
    /*
        Set all events needed for handling config changes
     */

    // init toggle switches
    Tuning.prototype.initToggles(function (dataEvents, active) {
        Tuning.prototype.configHandler($(this), 'toggle', active);
    });

    // input text boxes and other input elmnts
    $('.configValInputs').change(function () {
        Tuning.prototype.configHandler($(this), 'input');
    });
};

Tuning.prototype.serializeObjIfNeeded = function (inputData) {
    /*
        Check if given input data is an obj, and if so, serialize it
     */

    // NOTE: null is actually an obj; https://stackoverflow.com/a/8511350
    if(typeof inputData === 'object' && inputData !== null)
    {
        inputData = JSON.stringify(inputData);
    }

    return inputData;
};

Tuning.prototype.updateConfigVal = function (dataType, section, identifier, key, val, method) {
    /*
        Send update for given configuration data to Tuning API
     */

    if(method == null)
    {
        method = 'POST';
    }

    // check if key or val needs to be serialized for sending via api
    // normal value will be returned if it's a non-object
    key = Tuning.prototype.serializeObjIfNeeded(key);
    val = Tuning.prototype.serializeObjIfNeeded(val);

    // send api request via mystic lib
    Mystic.queryAPI(method, '/api/v1/tuning/', 20000, {
        t: dataType,
        s: section,
        i: identifier,
        k: key,
        v: val
    }, function () {
        ErrorBot.generateError(-1, 'configuration updated successfully');
    }, function () {
        ErrorBot.generateError(4, 'could not save configuration data via Inquisition API');
    });
};

Tuning.prototype.startSaveTimeout = function (dataType, section, identifier, key, val) {
    /*
        Start timeout until we save all configuration options

        Addl. Info: timeout is currently hard-coded to 2000ms or 2s
     */

    var timeoutMS = 2000;

    // clear old timer, if appl.
    if(this.saveTimer)
    {
        clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(function () {
        Tuning.prototype.updateConfigVal(dataType, section, identifier, key, val);
    }, timeoutMS);
};

Tuning.prototype.configHandler = function (elmnt, elmntType, isActive) {
    /*
        Handler for tuning configuration changes
     */

    var dataType = elmnt.data('datatype'),
        section = elmnt.data('section'),
        objIdentifier = elmnt.parents('.objContent').data('identifier'),
        key = elmnt.data('key'),
        rawConfigVal = elmnt.val();

    if(elmntType === 'toggle' && isActive === true)
    {
        rawConfigVal = 1;
    }

    Tuning.prototype.startSaveTimeout(dataType, section, objIdentifier, key, rawConfigVal);
};

Tuning.prototype.deleteInquisitionDataObj = function (dataType, identifier) {
    /*
        Delete data object with given params using Inquisition API
     */

    // send api request via mystic lib
    Mystic.queryAPI('DELETE', '/api/v1/tuning/', 20000, {
        t: dataType,
        i: identifier
    }, function () {
        ErrorBot.generateError(-1, dataType + ' deleted successfully');
    }, function () {
        ErrorBot.generateError(4, 'could not delete ' + dataType + ' via Inquisition API');
    });
};

Tuning.prototype.itemButtonHandler = function (itemElmnt, modalType, action, modalOpts, modalObj) {
    /*
        Handler for when an item's action buttons are acted upon (clicked) by the user
     */

    // get metadata of item
    var parentEntryContainer = itemElmnt.parents('tr');
    var dataType = parentEntryContainer.data('datatype'),
        objIdentifier = parentEntryContainer.data('identifier');

    // set opts based on action
    if(modalOpts == null)
    {
        // modal opts are not being overridden; set default based on action
        switch (action)
        {
            case 'delete':
                modalOpts = {
                    message: 'Are you sure you want to delete this ' + dataType.replace(/_/g, ' ') + '?',
                    callback: function (result) {
                        if(result)
                        {
                            // delete via api and remove from view
                            Tuning.prototype.deleteInquisitionDataObj(dataType, objIdentifier);
                            parentEntryContainer.fadeOut();
                        }
                    }
                };

                break;
            case 'edit':
                modalOpts = {
                    contentClassName: 'lgTuningModal',
                    unsafeContent: '' +
                    '<div class="modalContentWrapper">' +
                    '   <div class="heading modalHeader">Edit ' + dataType.replace(/_/g, ' ') + '</div>' +
                    '   <div class="modalContent objContent" data-identifier="' + objIdentifier + '">' +
                    Controller.initLoadingModal(null, 'small', true) +
                    '   </div>' +
                    '</div>'
                };

                break;
            default:
                throw 'invalid action provided to item button handler';
        }
    }

    if(modalObj == null)
    {
        modalObj = new Modal(dataType, objIdentifier, modalOpts, modalType);
    }

    // init modal
    modalObj.initModal();
};

Tuning.prototype.runPostConfigLoad = function () {
    /*
        Perform any logic needed for AFTER config data has been loaded into the view

        Addl. Info: this function is intended to be ran as a callback function, i.e. loaded by the controller directly
            for the Tuning module
     */

    // init fuzzy timestamps
    Global.initFuzzyTimestamps();

    // add listeners for config changes
    Tuning.prototype.setConfigChangeTriggerEvts();

    // modals for CRUD
    // set modal theme (requirement of vex)
    vex.defaultOptions.className = 'vex-theme-default';
    $('#tuning .delete').click(function () {
        Tuning.prototype.itemButtonHandler($(this), 'confirmation', 'delete');
    });

    $('#tuning .edit').click(function () {
        Tuning.prototype.itemButtonHandler($(this), 'general', 'edit');
    });
};