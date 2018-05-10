/*
    Inquisition // Celestial // Tuning.js

    - JS lib for tuning-related functionality, i.e. all data within tuning submodule of the UI
 */

"use strict";

var Tuning = function () {};

Tuning.prototype.updateConfigVal = function (section, key, val) {
    /*
        Send update for given configuration data to Tuning API
     */

    // send api request via mystic lib
    Mystic.queryAPI('POST', '/api/v1/tuning/', 20000, {
        t: 'cfg',
        s: section,
        k: key,
        v: val
    }, function () {
        ErrorBot.generateError(-1, 'configuration updated successfully');
    }, function () {
        ErrorBot.generateError(4, 'could not save configuration data via Inquisition API');
    });
};

Tuning.prototype.generateMiscOptHTML = function (configOptData) {
    /*
        Generate HTML for config options

        NOTES:
            * configOptData entries should match format of:
                * inputType (text, number, toggle)
                * label
                * key
                * rawVal
     */

    var toggleDataAttr = '';
    var optCount = 0;
    var html = '' +
        '               <table>' +
        '                   <tr>';

    configOptData.forEach(function (configOpt) {
        optCount++;

        html += '' +
            '                   <td>' +
            '                       <span>' + configOpt.label + '</span>' +
            '                   </td>' +
            '                   <td>';

        var configMetadataAttrs = 'data-section="' + configOpt.section + '" data-key="' + configOpt.key + '"';
        if(configOpt.inputType === 'toggle')
        {
            // set class for toggle(s) based on value
            if(configOpt.rawVal == true)
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

    var html = '' +
        '   <h3 class="listingHeader">' + title + '</h3>' +
        '   <div class="optSetListing">' +
        '       <div class="listingDataWrapper">' +
        '           <table class="listingData">' +
                        listingHTML +
        '          </table>' +
        '       </div>' +
        '   </div>';

    return html;
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
            '       <tr>';

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
            '               <span class="listingOptButtons">' +
            '                   <img src="/static/imgs/icons/edit.svg" title="Edit Parser Configuration" alt="Open modal to edit parser configuration">' +
            '                   <img src="/static/imgs/icons/delete.svg" title="Delete Parser" alt="Delete given parser permanently">' +
            '               </span>' +
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
        '           </tr>' +
        '           <tr>';

    templateData.forEach(function (template) {
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
            '               <span class="listingOptButtons">' +
            '                   <img src="/static/imgs/icons/edit.svg" title="Edit Template Configuration" alt="Open modal to edit template configuration">' +
            '                   <img src="/static/imgs/icons/delete.svg" title="Delete Template" alt="Delete given template permanently">' +
            '               </span>' +
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
            '       <tr>' +
            '           <td>' + knownHost.host_id + '</td>' +
            '           <td>' +
            '               <time class="fuzzyTimestamp" title="' + knownHost.created + '" datetime="' + knownHost.created
                            + '"></time>' +
            '           </td>' +
            '           <td>' + knownHost.host_val + '</td>' +
            '           <td>' +
            '               <span class="listingOptButtons">' +
            '                   <img src="/static/imgs/icons/delete.svg" title="Delete Known Host Entry" alt="Delete given host permanently">' +
            '               </span>' +
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
            '       <tr>' +
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
            '               <span class="listingOptButtons">' +
            '                   <img src="/static/imgs/icons/edit.svg" title="Edit Template Configuration" alt="Open modal to edit template configuration">' +
            '                   <img src="/static/imgs/icons/delete.svg" title="Delete Template" alt="Delete given template permanently">' +
            '               </span>' +
            '           </td>' +
            '       </tr>';
    });

    return Tuning.prototype.generateListingBoxHTML('Templates', listingHTML);
};

Tuning.prototype.loadTuningConfiguration = function (onlyContent, tuningData, contentWrapper, titleHTML) {
    /*
        Load configuration to be tuned, along w/ current vals, to view for user to interact with
     */

    console.log(tuningData);

    var tuningDataset = tuningData.data;
    var parsingConfigOpts = [
        {
            inputType: 'number',
            label: 'Sleep Time',
            section: 'parsing',
            key: 'sleepTime',
            rawVal: tuningDataset.cfg.parsing.sleepTime
        },
        {
            inputType: 'number',
            label: 'Num Sleeps Between Stat Logging',
            section: 'parsing',
            key: 'numSleepsBetweenStats',
            rawVal: tuningDataset.cfg.parsing.numSleepsBetweenStats
        },
        {
            inputType: 'number',
            label: 'Log TTL',
            section: 'parsing',
            key: 'logTTL',
            rawVal: tuningDataset.cfg.parsing.logTTL
        },
        {
            inputType: 'number',
            label: 'Max Logs To Parse',
            section: 'parsing',
            key: 'maxLogsToParse',
            rawVal: tuningDataset.cfg.parsing.maxLogsToParse
        },
        {
            inputType: 'toggle',
            label: 'Hazy Tracking',
            section: 'state_tracking',
            key: 'enableHazyStateTracking',
            rawVal: tuningDataset.cfg.state_tracking.enableHazyStateTracking
        },
        {
            inputType: 'number',
            label: 'Num Logs Between State Updates',
            section: 'state_tracking',
            key: 'stateTrackingWaitNumLogs',
            rawVal: tuningDataset.cfg.state_tracking.stateTrackingWaitNumLogs
        }
    ];

    var analysisConfigOpts = [
        {
            inputType: 'toggle',
            label: 'Baseline Mode',
            section: 'learning',
            key: 'enableBaselineMode',
            rawVal: tuningDataset.cfg.learning.enableBaselineMode
        },
        {
            inputType: 'number',
            label: 'Sleep Time (Threat Detection)',
            section: 'learning',
            key: 'networkThreatDetectionSleepTime',
            rawVal: tuningDataset.cfg.learning.networkThreatDetectionSleepTime
        },
        {
            inputType: 'number',
            label: 'Sleep Time (Anomaly Detection)',
            section: 'learning',
            key: 'anomalyDetectionSleepTime',
            rawVal: tuningDataset.cfg.learning.anomalyDetectionSleepTime
        },
        {
            inputType: 'float',
            label: 'Max Standard Deviation Tolerance',
            section: 'alerting',
            key: 'maxTrafficNodeStdDev',
            rawVal: tuningDataset.cfg.alerting.maxTrafficNodeStdDev
        }
    ];

    var addlMiscConfigs = [
        {
            inputType: 'text',
            label: 'App. Log File',
            section: 'logging',
            key: 'logFile',
            rawVal: tuningDataset.cfg.logging.logFile
        },
        {
            inputType: 'text',
            label: 'App. Logging Level',
            section: 'logging',
            key: 'logLvl',
            rawVal: tuningDataset.cfg.logging.logLvl
        },
        {
            inputType: 'text',
            label: 'App. Log Format Template',
            section: 'logging',
            key: 'logFormat',
            rawVal: tuningDataset.cfg.logging.logFormat
        },
        {
            inputType: 'toggle',
            label: 'Metrics Mode',
            section: 'logging',
            key: 'enableMetricsMode',
            rawVal: tuningDataset.cfg.logging.enableMetricsMode
        },
        {
            inputType: 'toggle',
            label: 'Print Template Match',
            section: 'logging',
            key: 'printMatchValues',
            rawVal: tuningDataset.cfg.logging.printMatchValues
        },
        {
            inputType: 'toggle',
            label: 'Verbose Logging',
            section: 'logging',
            key: 'verbose',
            rawVal: tuningDataset.cfg.logging.verbose
        },
        {
            inputType: 'toggle',
            label: 'Store Stats Persistently',
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

Tuning.prototype.startSaveTimeout = function (section, key, val) {
    /*
        Start timeout until we save all configuration options

        Addl. Info: timeout is currently hard-coded to 2000ms or 2s
     */

    // clear old timer, if appl.
    if(this.saveTimer)
    {
        clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(function () {
        Tuning.prototype.updateConfigVal(section, key, val);
    }, 2000);
};

Tuning.prototype.setPostConfigLoadingOptions = function () {
    /*
        Perform any logic needed for AFTER config data has been loaded
     */

    // init timeago fuzzy timestamps
    $('time.fuzzyTimestamp').timeago();

    // init toggle switches
    var toggleSwitches = $('.toggleSwitch');
    toggleSwitches.toggles();

    // add listeners for config changes
    var section = '';
    var key = '';
    var rawConfigVal = 0;
    // toggles
    toggleSwitches.on('toggle', function (dataEvents, active) {
        section = $(this).data('section');
        key = $(this).data('key');

        if(active)
        {
            rawConfigVal = 1;
        }

        Tuning.prototype.startSaveTimeout(section, key, rawConfigVal);
    });
    // input text boxes and other input elmnts
    $('.configValInputs').change(function () {
        section = $(this).data('section');
        key = $(this).data('key');
        rawConfigVal = $(this).val();

        Tuning.prototype.startSaveTimeout(section, key, rawConfigVal);
    })
};