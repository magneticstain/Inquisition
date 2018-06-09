/*
    Inquisition // Celestial // Tuning.js

    - JS lib for tuning-related functionality, i.e. all data within tuning submodule of the UI
 */

"use strict";

var Tuning = function () {};

Tuning.prototype.updateConfigVal = function (dataType, section, identifier, key, val) {
    /*
        Send update for given configuration data to Tuning API
     */

    // send api request via mystic lib
    Mystic.queryAPI('POST', '/api/v1/tuning/', 20000, {
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

Tuning.prototype.initToggles = function (onToggleCallback) {
    /*
        Initialize all toggle buttons on current page
     */

    var toggleSwitches = $('.toggleSwitch');
    toggleSwitches.toggles();

    // add listener if needed
    if(onToggleCallback != null)
    {
        toggleSwitches.on('toggle', onToggleCallback);
    }
};

Tuning.prototype.generateMiscOptHTML = function (configOptData) {
    /*
        Generate HTML for config options

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

    var toggleDataAttr = '';
    var optCount = 0;
    var html = '' +
        '               <table>' +
        '                   <tr>';

    // traverse config opt dataset
    configOptData.forEach(function (configOpt) {
        optCount++;

        // add config label
        html += '' +
            '                   <td>' +
            '                       <span class="configOptLabel" title="' + configOpt.desc + '">' + configOpt.label
                                    + '</span>' +
            '                   </td>' +
            '                   <td>';

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

            html += '' +
                '                   <div ' + configMetadataAttrs + ' ' + toggleDataAttr
                + ' class="toggleSwitch toggle-modern"></div>';
        }
        else
        {
            var addlElmntAttrs = '';
            if(configOpt.inputType === 'float')
            {
                configOpt.inputType = 'number';
                addlElmntAttrs = 'step="0.001"';
            }

            html += '' +
                '                   <input class="configValInputs" ' + configMetadataAttrs + ' type="'
                + configOpt.inputType + '" ' + addlElmntAttrs + ' value="' + configOpt.rawVal + '">';
        }

        html += ''  +
            '                   </td>';

        if(0 < optCount && (optCount % 2 === 0 || optCount === configOptData.length))
        {
            // even number of entries or last entry, end table row
            html += '' +
                '           </tr>';

            if(optCount !== configOptData.length)
            {
                // not the last element in the set, expect a new row
                html += '' +
                    '           <tr>';
            }
        }
    });


    html += '' +
        '               </table>';

    return html;
};

Tuning.prototype.generateListingBoxHTML = function (title, listingHTML) {
    /*
        Generate generic box with given listing html
     */

    return '' +
        '   <h3 class="heading listingHeader">' + title + '</h3>' +
        '   <div class="optSetListing">' +
        '       <div class="listingDataWrapper">' +
        '           <table class="listingData">' +
                        listingHTML +
        '          </table>' +
        '       </div>' +
        '   </div>';
};

Tuning.prototype.generateListingButtonHTML = function (addEditButton, addDeleteButton) {
    /*
        generate HTML for option listing action buttons
     */

    var buttonHTML = '' +
        '               <span class="listingOptButtons">';

    if(addEditButton)
    {
        buttonHTML += '' +
            '                   <img class="edit" src="/static/imgs/icons/edit.svg" title="Edit Configuration" alt="Open modal to edit configuration">';
    }

    if(addDeleteButton)
    {
        buttonHTML += '' +
            '                   <img class="delete" src="/static/imgs/icons/delete.svg" title="Delete Listing" alt="Delete given listing data permanently">';
    }

    buttonHTML += '' +
        '               </span>';

    return buttonHTML;
};

Tuning.prototype.generateParserListingHTML = function (parserData) {
    /*
        Generate HTML to display the given parsers as HTML elements
     */

    var listingHTML = '' +
        '           <tr>' +
        '               <th>STATUS</th>' +
        '               <th>ID</th>' +
        '               <th>CREATED</th>' +
        '               <th>NAME</th>' +
        '               <th>LOG</th>' +
        '               <th>OPTIONS</th>' +
        '           </tr>';

    parserData.forEach(function (parser) {
        listingHTML += '' +
            '       <tr data-dataType="parser" data-identifier="' + parser.parser_id + '">';

        if(parser.status == true)
        {
            listingHTML += '           <td><span class="enabled" title="Parser is ENABLED">&#10004;</span></td>';
        }
        else
        {
            listingHTML += '           <td><span class="disabled" title="Parser is DISABLED">&#10008;</span></td>';
        }

        listingHTML += '' +
            '           <td>' + parser.parser_id + '</td>' +
            '           <td>' +
            '               <time class="fuzzyTimestamp" title="' + parser.created + '" datetime="' + parser.created
                            + '"></time>' +
            '           </td>' +
            '           <td>' + parser.parser_name + '</td>' +
            '           <td>' + parser.parser_log + '</td>' +
            '           <td>' +
                            Tuning.prototype.generateListingButtonHTML(true, true) +
            '           </td>' +
            '       </tr>';
    });

    return Tuning.prototype.generateListingBoxHTML('Parsers', listingHTML);
};

Tuning.prototype.generateTemplateListingHTML = function (templateData) {
    /*
        Generate HTML to display the given templates as HTML elements
     */

    var listingHTML = '' +
        '           <tr>' +
        '               <th>STATUS</th>' +
        '               <th>ID</th>' +
        '               <th>CREATED</th>' +
        '               <th>NAME</th>' +
        '               <th>OPTIONS</th>' +
        '           </tr>';

    templateData.forEach(function (template) {
        listingHTML += '' +
            '       <tr data-dataType="template" data-identifier="' + template.template_id + '">';

        if(template.status == true)
        {
            listingHTML += '           <td><span class="enabled" title="Template is ENABLED">&#10004;</span></td>';
        }
        else
        {
            listingHTML += '           <td><span class="disabled" title="Template is DISABLED">&#10008;</span></td>';
        }

        listingHTML += '' +
            '           <td>' + template.template_id + '</td>' +
            '           <td>' +
            '               <time class="fuzzyTimestamp" title="' + template.created + '" datetime="' + template.created
                            + '"></time>' +
            '           </td>' +
            '           <td>' + template.template_name + '</td>' +
            '           <td>' +
                            Tuning.prototype.generateListingButtonHTML(true, true) +
            '           </td>' +
            '       </tr>';
    });

    return Tuning.prototype.generateListingBoxHTML('Templates', listingHTML);
};

Tuning.prototype.generateKnownHostListingHTML = function (knownHostData) {
    /*
        Generate HTML to display the hosts already known to inquisition
     */

    var listingHTML = '' +
        '           <tr>' +
        '               <th>ID</th>' +
        '               <th>CREATED</th>' +
        '               <th>HOST</th>' +
        '               <th>OPTIONS</th>' +
        '           </tr>';

    knownHostData.forEach(function (knownHost) {
        listingHTML += '' +
            '       <tr data-dataType="known_host" data-identifier="' + knownHost.host_id + '">' +
            '           <td>' + knownHost.host_id + '</td>' +
            '           <td>' +
            '               <time class="fuzzyTimestamp" title="' + knownHost.created + '" datetime="'
                            + knownHost.created + '"></time>' +
            '           </td>' +
            '           <td>' + knownHost.host_val + '</td>' +
            '           <td>' +
                            Tuning.prototype.generateListingButtonHTML(false, true) +
            '           </td>' +
            '       </tr>';
    });

    return Tuning.prototype.generateListingBoxHTML('Known Hosts', listingHTML);
};

Tuning.prototype.generateIntelIOCListingHTML = function (iocData, fieldData) {
    /*
        Generate HTML to display the listing of field mappings made for IOC sources
     */

    var listingHTML = '' +
        '           <tr>' +
        '               <th>ID</th>' +
        '               <th>IOC ITEM NAME</th>' +
        '               <th>MAPPED FIELD NAME</th>' +
        '               <th>OPTIONS</th>' +
        '           </tr>';

    iocData.forEach(function (iocItem) {
        listingHTML += '' +
            '       <tr data-dataType="ioc_field_mapping" data-identifier="' + iocItem.mapping_id + '">' +
            '           <td>' + iocItem.mapping_id + '</td>' +
            '           <td>' + iocItem.ioc_item_name + '</td>';

        // translate field ID to field name for UX purposes, making sure to include the field ID as a data attr
        var iocFieldName = 'UNKNOWN';
        for(var i = 0; i < fieldData.length; i++)
        {
            if(fieldData[i].field_id === iocItem.field_id)
            {
                iocFieldName = fieldData[i].field_name;

                break;
            }
        }

        listingHTML += '' +
            '           <td data-field-id="' + iocItem.field_id + '">' + iocFieldName + '</td>' +
            '           <td>' +
                            Tuning.prototype.generateListingButtonHTML(true, true) +
            '           </td>' +
            '       </tr>';
    });

    return Tuning.prototype.generateListingBoxHTML('Intel Field Mappings', listingHTML);
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
        clearTimeout(this.saveTimer);2000
    }

    this.saveTimer = setTimeout(function () {
        Tuning.prototype.updateConfigVal(dataType, section, identifier, key, val);
    }, timeoutMS);
};

Tuning.prototype.loadTuningConfiguration = function (onlyContent, tuningData, contentWrapper, titleHTML) {
    /*
        Load and display configuration to be tuned, along w/ current vals, to view for user to interact with
     */

    var tuningDataset = tuningData.data;
    var parsingConfigOpts = [
        {
            inputType: 'number',
            label: 'Sleep Time',
            desc: 'Amount of time (in seconds) a parser should sleep for between checks for new logs/data (default: 2)',
            dataType: 'cfg',
            section: 'parsing',
            key: 'sleepTime',
            rawVal: tuningDataset.cfg.parsing.sleepTime
        },
        {
            inputType: 'number',
            label: 'Num Sleeps Between Stat Logging',
            desc: 'Number of sleeps the parser should go through before printing general stats in log (default: 10)',
            dataType: 'cfg',
            section: 'parsing',
            key: 'numSleepsBetweenStats',
            rawVal: tuningDataset.cfg.parsing.numSleepsBetweenStats
        },
        {
            inputType: 'number',
            label: 'Log TTL',
            desc: 'Amount of time (in seconds) to store logs in the Log DB',
            dataType: 'cfg',
            section: 'parsing',
            key: 'logTTL',
            rawVal: tuningDataset.cfg.parsing.logTTL
        },
        {
            inputType: 'number',
            label: 'Max Logs To Parse',
            desc: 'Number of logs a parser should read before exiting. If set to 0, the parser will never stop reading. ' +
            '(default: 0)',
            dataType: 'cfg',
            section: 'parsing',
            key: 'maxLogsToParse',
            rawVal: tuningDataset.cfg.parsing.maxLogsToParse
        },
        {
            inputType: 'toggle',
            label: 'Hazy Tracking',
            desc: 'If set to true, it enables a feature that reduces state tracking accuracy in return for increased ' +
            'parsing speed. See Inquisition docs for more details (default: 0 [F])',
            dataType: 'cfg',
            section: 'state_tracking',
            key: 'enableHazyStateTracking',
            rawVal: tuningDataset.cfg.state_tracking.enableHazyStateTracking
        },
        {
            inputType: 'number',
            label: 'Num Logs Between State Updates',
            desc: 'If hazy state tracking is enabled, this is the amount of logs a parser will wait before updating ' +
            'the offset file (default: 5)',
            dataType: 'cfg',
            section: 'state_tracking',
            key: 'stateTrackingWaitNumLogs',
            rawVal: tuningDataset.cfg.state_tracking.stateTrackingWaitNumLogs
        }
    ];

    var analysisConfigOpts = [
        {
            inputType: 'toggle',
            label: 'Baseline Mode',
            desc: '',
            dataType: 'cfg',
            section: 'learning',
            key: 'enableBaselineMode',
            rawVal: tuningDataset.cfg.learning.enableBaselineMode
        },
        {
            inputType: 'number',
            label: 'Sleep Time (Threat Detection)',
            desc: '',
            dataType: 'cfg',
            section: 'learning',
            key: 'networkThreatDetectionSleepTime',
            rawVal: tuningDataset.cfg.learning.networkThreatDetectionSleepTime
        },
        {
            inputType: 'number',
            label: 'Sleep Time (Anomaly Detection)',
            desc: '',
            dataType: 'cfg',
            section: 'learning',
            key: 'anomalyDetectionSleepTime',
            rawVal: tuningDataset.cfg.learning.anomalyDetectionSleepTime
        },
        {
            inputType: 'float',
            label: 'Max Standard Deviation Tolerance',
            desc: '',
            dataType: 'cfg',
            section: 'alerting',
            key: 'maxTrafficNodeStdDev',
            rawVal: tuningDataset.cfg.alerting.maxTrafficNodeStdDev
        }
    ];

    var addlMiscConfigs = [
        {
            inputType: 'text',
            label: 'App. Log File',
            desc: 'Filename to write application logs to',
            dataType: 'cfg',
            section: 'logging',
            key: 'logFile',
            rawVal: tuningDataset.cfg.logging.logFile
        },
        {
            inputType: 'text',
            label: 'App. Logging Level',
            desc: 'Minimum level of logging to write to disk. For example, a setting of \'ERROR\' will write logs ' +
            'with a severity level of ERROR and CRITICAL. (DEBUG|INFO|WARNING|ERROR|CRITICAL) (default: INFO)',
            dataType: 'cfg',
            section: 'logging',
            key: 'logLvl',
            rawVal: tuningDataset.cfg.logging.logLvl
        },
        {
            inputType: 'text',
            label: 'App. Log Format Template',
            desc: 'Formatting of logs being written. More info on formatting syntax can be found in the documentation ' +
            'for the logging library in Python (default: %(asctime)s [ %(levelname)s ] [ %(name)s ] %(message)s',
            dataType: 'cfg',
            section: 'logging',
            key: 'logFormat',
            rawVal: tuningDataset.cfg.logging.logFormat
        },
        {
            inputType: 'toggle',
            label: 'Metrics Mode',
            desc: 'If enabled, write stat for run-based stats at the INFO level instead of DEBUG level (default: 0 [F])',
            dataType: 'cfg',
            section: 'logging',
            key: 'enableMetricsMode',
            rawVal: tuningDataset.cfg.logging.enableMetricsMode
        },
        {
            inputType: 'toggle',
            label: 'Print Template Match',
            desc: 'Specifies whether parser should write the values its templates match in the log. ' +
            'This should be disabled if you are parsing sensitive information in your logs or are must abide by ' +
            'various compliance frameworks (e.g. PCI w/ credit card data in the logs).',
            dataType: 'cfg',
            section: 'logging',
            key: 'printMatchValues',
            rawVal: tuningDataset.cfg.logging.printMatchValues
        },
        {
            inputType: 'toggle',
            label: 'Verbose Logging',
            desc: 'Specifies whether parser should write ALL data it processes to logs. Usually only useful for ' +
            'debugging or compliance.',
            dataType: 'cfg',
            section: 'logging',
            key: 'verbose',
            rawVal: tuningDataset.cfg.logging.verbose
        },
        {
            inputType: 'toggle',
            label: 'Store Stats Persistently',
            desc: 'If set to true, store stat data in the Log DB for easy and persistent access (default: 1 [T])',
            dataType: 'cfg',
            section: 'stats',
            key: 'keepPersistentStats',
            rawVal: tuningDataset.cfg.stats.keepPersistentStats
        }
    ];

    var contentHTML = titleHTML +
        '<div id="primaryContentData" class="contentModule">' +
        '   <div id="tuningOptsWrapper" class="moduleDataWrapper">' +
        '       <div class="optSetBundle">' +
        '           <h2 class="title subtitle">Parsing Options</h2>' +
        '           <div class="optWrapper configs">' +
        Tuning.prototype.generateMiscOptHTML(parsingConfigOpts) +
        '           </div>' +
        '           <div class="optWrapper">' +
        Tuning.prototype.generateTemplateListingHTML(tuningDataset.template) +
        '           </div>' +
        '           <div class="optWrapper">' +
        Tuning.prototype.generateParserListingHTML(tuningDataset.parser) +
        '           </div>' +
        '       </div>' +
        '       <div class="optSetBundle">' +
        '           <h2 class="title subtitle">Analysis Options</h2>' +
        '           <div class="optWrapper configs">' +
        Tuning.prototype.generateMiscOptHTML(analysisConfigOpts) +
        '           </div>' +
        '           <div class="optWrapper">' +
        Tuning.prototype.generateKnownHostListingHTML(tuningDataset.known_host) +
        '           </div>' +
        '           <div class="optWrapper">' +
        '           </div>' +
        '       </div>' +
        '       <div class="optSetBundle">' +
        '           <h2 class="title subtitle">Intel Options</h2>' +
        '           <div class="optWrapper configs">' +
        Tuning.prototype.generateMiscOptHTML([
            {
                inputType: 'number',
                label: 'Sleep Time',
                dataType: 'cfg',
                section: 'intel',
                key: 'sleepTime',
                rawVal: tuningDataset.cfg.intel.sleepTime
            }
        ]) +
        '           </div>' +
        '           <div class="optWrapper">' +
        Tuning.prototype.generateIntelIOCListingHTML(tuningDataset.ioc_field_mapping, tuningDataset.field) +
        '           </div>' +
        '       </div>' +
        '       <div class="optSetBundle">' +
        '           <h2 class="title subtitle">Application Configuration Options</h2>' +
        '           <div class="optWrapper configs">' +
        Tuning.prototype.generateMiscOptHTML(addlMiscConfigs) +
        '           </div>' +
        '       </div>' +
        '   </div>' +
        '</div>';

    // update content container with html data
    contentWrapper.html(contentHTML);
};

Tuning.prototype.setConfigChangeTriggerEvts = function () {
    /*
        Set all events needed for handling config changes
     */

    var dataType = '',
        section = '',
        objIdentifier = 0,
        key = '',
        rawConfigVal = 0;

    // init toggle switches
    Tuning.prototype.initToggles(function (dataEvents, active) {
        dataType = $(this).data('datatype');
        section = $(this).data('section');
        objIdentifier = $(this).parents('.objContent').data('identifier');
        key = $(this).data('key');

        if(active)
        {
            rawConfigVal = 1;
        }

        Tuning.prototype.startSaveTimeout(dataType, section, objIdentifier, key, rawConfigVal);
    });

    // input text boxes and other input elmnts
    $('.configValInputs').change(function () {
        dataType = $(this).data('datatype');
        section = $(this).data('section');
        objIdentifier = $(this).parents('.objContent').data('identifier');
        key = $(this).data('key');
        rawConfigVal = $(this).val();

        Tuning.prototype.startSaveTimeout(dataType, section, objIdentifier, key, rawConfigVal);
    });
};

Tuning.prototype.generateModalContentSetHTML = function (dataType, dataSet) {
    /*
        Generate HTML of interactive list using given data
     */

    if(dataType == null)
    {
        throw 'empty data type not allowed when generating modal set HTML';
    }

    var html = '' +
        '<ol class="modalContentSetDataList ' + dataType + 'DataSet">';

    // get data identifier
    var parentObjDataId = $('.' + dataType + 'List').data(dataType + '-id'),
        itemDataId = 0,
        itemName = 'UNKNOWN',
        itemKeyName = '',
        selectedItemClass = '';

    dataSet.forEach(function (modalContentItem) {
        // get item ID based on data type
        switch(dataType)
        {
            case 'field':
                itemDataId = modalContentItem.field_id;
                itemName = modalContentItem.field_name;
                itemKeyName = 'field_id';

                break;
            case 'regex':
                itemDataId = modalContentItem.regex_id;
                itemName = modalContentItem.regex;
                itemKeyName = 'regex_id';

                break;
        }

        // add html, with selected class being added if id's match
        if(parentObjDataId === itemDataId)
        {
            selectedItemClass = 'ui-selected';
        }
        else
        {
            // reset class to null string
            selectedItemClass = '';
        }

        html += '<li class="modalContentSetDataListEntry ui-widget-content ' + selectedItemClass + '" data-item-id="'
            + itemDataId + '" data-item-key-name="' + itemKeyName + '">' + itemName + '</li>';
    });

    html += '</ol>';

    return html;
};

Tuning.prototype.generateModalContentSet = function (dataType, parentObjDataType) {
    /*
        Fetch data for given modal data type, format it, and update the modal/view
     */

    if(dataType == null)
    {
        throw 'empty data type not allowed when generating modal content sets';
    }
    else
    {
        var titleCaseDataType = Global.normalizeTitle(dataType),
            titleCaseParentObjDataType = Global.normalizeTitle(parentObjDataType);
    }

    Mystic.queryAPI('GET', '/api/v1/tuning/?t=' + dataType, 5000, null, function (apiData) {
        $('.modalContentSetData.' + dataType + 'List').html('<p ' +
            'title="' + titleCaseParentObjDataType + ' ' + titleCaseDataType + ' Selections // ' +
            'Tip: Press and hold the control key while clicking to unselect an option" ' +
            'class="modalContentSetHeader title">' + titleCaseDataType + '</p>'
            + Tuning.prototype.generateModalContentSetHTML(dataType, apiData.data));

        // make data set lists selectable
        $('.modalContentSetDataList.' + dataType + 'DataSet').selectable({
            selected: function (event, uiElmnt) {
                var currentItem = $('.ui-selected', this),
                    objId = $(this).parents('.modalContentSet').data('objid'),
                    itemKey = currentItem.data('item-key-name'),
                    itemRawCfgVal = currentItem.data('item-id');

                Tuning.prototype.startSaveTimeout(parentObjDataType, '', objId, itemKey, itemRawCfgVal);
            }
        });
    }, function () {
        ErrorBot.generateError(4, 'could not load ' + dataType + ' data from the Inquisition API');
    });
};

Tuning.prototype.generateEditModalHTML = function (optionData, modalContentSetHTML) {
    /*
        Generates full HTML for an edit modal with given option data
     */

    if(modalContentSetHTML == null)
    {
        modalContentSetHTML = '';
    }

    return '' +
        '<div class="optWrapper configs">' +
        Tuning.prototype.generateMiscOptHTML(optionData) +
        '</div>' +
        '<div class="optSetBundle modalContentSet" data-objid="' + this.objId + '">' +
        modalContentSetHTML +
        '</div>';
};

Tuning.prototype.loadConfigEditData = function (dataType, identifier) {
    /*
        Perform API query to load necessary data based on data type
     */

    var fadeOutFunct = function () {},
        fadeInFunct = function () {},
        modalHTML = '';

    // set identifier as an obj var so that it can be used elsewhere downstream
    this.objId = identifier;

    switch(dataType)
    {
        case 'template':
            fadeOutFunct = function (onlyContent, apiData, contentWrapper) {
                modalHTML = Tuning.prototype.generateEditModalHTML([
                    {
                        inputType: 'toggle',
                        label: 'Status',
                        desc: 'Status of template (enabled or disabled)',
                        dataType: dataType,
                        section: '',
                        key: 'status',
                        rawVal: apiData.data[0].status
                    },
                    {
                        inputType: 'text',
                        label: 'Name',
                        desc: 'Name of template',
                        dataType: dataType,
                        section: '',
                        key: 'template_name',
                        rawVal: apiData.data[0].template_name
                    }
                ], '<div class="modalContentSetData fieldList" data-field-id="' + apiData.data[0].field_id + '"></div>' +
                    '<div class="modalContentSetData regexList" data-regex-id="' + apiData.data[0].regex_id + '"></div>');

                contentWrapper.html(modalHTML);
            };

            fadeInFunct = function () {
                Tuning.prototype.setConfigChangeTriggerEvts();

                // gather fields and regex data
                Tuning.prototype.generateModalContentSet('field', 'template');
                Tuning.prototype.generateModalContentSet('regex', 'template');
            };

            break;
        case 'parser':
            fadeOutFunct = function (onlyContent, apiData, contentWrapper) {
                modalHTML = Tuning.prototype.generateEditModalHTML([
                    {
                        inputType: 'toggle',
                        label: 'Status',
                        desc: 'Status of parser (enabled or disabled)',
                        dataType: dataType,
                        section: '',
                        key: 'status',
                        rawVal: apiData.data[0].status
                    },
                    {
                        inputType: 'text',
                        label: 'Name',
                        desc: 'Name of parser',
                        dataType: dataType,
                        section: '',
                        key: 'parser_name',
                        rawVal: apiData.data[0].parser_name
                    },
                    {
                        inputType: 'text',
                        label: 'Log File',
                        desc: 'Filename that log parser should analyze',
                        dataType: dataType,
                        section: '',
                        key: 'parser_log',
                        rawVal: apiData.data[0].parser_log
                    }
                ]);

                contentWrapper.html(modalHTML);
            };

            break;
        case 'ioc_field_mapping':
            fadeOutFunct = function (onlyContent, apiData, contentWrapper) {
                modalHTML = Tuning.prototype.generateEditModalHTML([
                    {
                        inputType: 'text',
                        label: 'IOC Item Name',
                        desc: 'Name of IOC item being fetched',
                        dataType: dataType,
                        section: '',
                        key: 'ioc_item_name',
                        rawVal: apiData.data[0].ioc_item_name
                    }
                ]);

                contentWrapper.html(modalHTML);
            };

            break;
    }

    Mystic.initAPILoad(false, $('.modalContent'), 'GET', '/api/v1/tuning/?t=' + dataType + '&i=' + this.objId,
        fadeOutFunct, fadeInFunct, 10000);
};

Tuning.prototype.setPostConfigLoadingOptions = function () {
    /*
        Perform any logic needed for AFTER config data has been loaded
     */

    // init timeago fuzzy timestamps
    $('time.fuzzyTimestamp').timeago();

    // add listeners for config changes
    Tuning.prototype.setConfigChangeTriggerEvts();

    // modals for CRUD
    // set modal theme (requirement of vex)
    vex.defaultOptions.className = 'vex-theme-default';
    $('#tuning .delete').click(function () {
        // get metadata of listing
        var parentEntryContainer = $(this).parents('tr');
        var dataType = parentEntryContainer.data('datatype'),
            objIdentifier = parentEntryContainer.data('identifier');

        vex.dialog.confirm({
            message: 'Are you sure you want to delete this ' + dataType.replace(/_/g, ' ') + '?',
            callback: function (result) {
                if(result)
                {
                    // delete via api and remove from view
                    Tuning.prototype.deleteInquisitionDataObj(dataType, objIdentifier);
                    parentEntryContainer.fadeOut();
                }
            }
        });
    });

    $('#tuning .edit').click(function () {
        // get metadata of listing and generate html for edit modal
        var parentEntryContainer = $(this).parents('tr');
        var dataType = parentEntryContainer.data('datatype'),
            objIdentifier = parentEntryContainer.data('identifier');

        vex.open({
            contentClassName: 'lgTuningModal',
            unsafeContent: '' +
            '<div class="modalContentWrapper">' +
            '   <div class="heading modalHeader">Edit ' + dataType.replace(/_/g, ' ') + '</div>' +
            '   <div class="modalContent objContent" data-identifier="' + objIdentifier + '">' +
            Controller.initLoadingModal(null, 'small', true) +
            '   </div>' +
            '</div>'
        });

        Tuning.prototype.loadConfigEditData(dataType, objIdentifier);
    });
};