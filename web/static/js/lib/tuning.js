/*
    Inquisition // Celestial // Tuning.js

    - JS lib for tuning-related functionality, i.e. all data within tuning submodule of the UI
 */

"use strict";

var Tuning = function () {};

Tuning.prototype.generateMiscParsingOptHTML = function (sleepTime, numSleepsBetweenStats, logTTL, maxLogsToParse,
                                                        enableHazyStateTracking, stateTrackingWaitNumLogs) {
    /*
        Generate HTML for parser config file options
     */

    // set class for toggle(s) based on hazy tracking flag
    var toggleClass = '';
    if(enableHazyStateTracking == true)
    {
        toggleClass = ' toggle-on';
    }
    else
    {
        toggleClass = ' toggle-off';
    }

    var html = '' +
        '           <form>' +
        '               <table>' +
        '                   <tr>' +
        '                       <td>' +
        '                           <label>Sleep Time</label>' +
        '                       </td>' +
        '                       <td>' +
        '                           <input id="sleepTime" type="number" value="' + sleepTime + '">' +
        '                       </td>' +
        '                       <td>' +
        '                           <label>Num Sleeps Between Stat Logging</label>' +
        '                       </td>' +
        '                       <td>' +
        '                           <input id="numSleepsBetweenStats" type="number" value="' + numSleepsBetweenStats
                                    + '">' +
        '                       </td>' +
        '                   </tr>' +
        '                   <tr>' +
        '                       <td>' +
        '                           <label>Log TTL</label>' +
        '                       </td>' +
        '                       <td>' +
        '                           <input id="logTTL" type="number" value="' + logTTL + '">' +
        '                       </td>' +
        '                       <td>' +
        '                           <label>Max Logs To Parse</label>' +
        '                       </td>' +
        '                       <td>' +
        '                           <input id="maxLogsToParse" type="number" value="' + maxLogsToParse + '">' +
        '                       </td>' +
        '                   </tr>' +
        '                   <tr>' +
        '                       <td>' +
        '                           <label>Hazy Tracking</label>' +
        '                       </td>' +
        '                       <td>' +
        '                           <div id="enableHazyStateTracking" class="toggleSwitch toggle-modern' + toggleClass
                                    + '"></div>' +
        '                       </td>' +
        '                       <td>' +
        '                           <label>Num Logs Between State Updates</label>' +
        '                       </td>' +
        '                       <td>' +
        '                           <input id="stateTrackingWaitNumLogs" type="number" value="' + stateTrackingWaitNumLogs + '">' +
        '                       </td>' +
        '                   </tr>' +
        '               </table>' +
        '           </form>';

    return html;
};

Tuning.prototype.generateListingBoxHTML = function (title, listingHTML) {
    /*
        Generate generic box with given listing html
     */

    var html = '' +
        '<h3 class="listingHeader">' + title + '</h3>' +
        '<div class="optSetListing">' +
        '   <div class="listingDataWrapper">' +
        '       <table class="listingData">' +
                    listingHTML +
        '       </table>' +
        '   </div>' +
        '</div>';

    return html;
};

Tuning.prototype.generateParserListingHTML = function (parserData) {
    /*
        Generate HTML to display the given parsers as HTML elements
     */

    var listingHTML = '' +
        '           <tr>' +
        '               <th>ID</th>' +
        '               <th>NAME</th>' +
        '               <th>CREATED</th>' +
        '               <th>LOG</th>' +
        '               <th>STATUS</th>' +
        '               <th>OPTIONS</th>' +
        '           </tr>';

    parserData.forEach(function (parser) {
        listingHTML += '' +
            '       <tr>' +
            '           <td>' + parser.parser_id + '</td>' +
            '           <td>' + parser.parser_name + '</td>' +
            '           <td>' +
            '               <time class="fuzzyTimestamp" title="' + parser.created + '" datetime="' + parser.created
                            + '"></time>' +
            '           </td>' +
            '           <td>' + parser.parser_log + '</td>';

            if(parser.status == true)
            {
                listingHTML += '           <td><span class="enabled" title="Parser is ENABLED">&#10004;</span></td>';
            }
            else
            {
                listingHTML += '           <td><span class="disabled" title="Parser is DISABLED">&#10008;</span></td>';
            }

            // generate various parser options
        listingHTML += '' +
                '           <td>' +
                '               <span class="listingOptButtons">' +
                '                   <img src="/static/imgs/icons/edit.svg" title="Edit Parser Configuration" alt="Open modal to edit parser configuration">' +
                '                   <img src="/static/imgs/icons/delete.svg" title="Delete Parser" alt="Delete given parser permanently">' +
                '               </span>' +
                '           </td>';

        listingHTML +=
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
        '               <th>ID</th>' +
        '               <th>NAME</th>' +
        '               <th>CREATED</th>' +
        '               <th>STATUS</th>' +
        '               <th>OPTIONS</th>' +
        '           </tr>';

    templateData.forEach(function (template) {
        listingHTML += '' +
            '       <tr>' +
            '           <td>' + template.template_id + '</td>' +
            '           <td>' + template.template_name + '</td>' +
            '           <td>' +
            '               <time class="fuzzyTimestamp" title="' + template.created + '" datetime="' + template.created
                            + '"></time>' +
            '           </td>';

        if(template.status == true)
        {
            listingHTML += '           <td><span class="enabled" title="Template is ENABLED">&#10004;</span></td>';
        }
        else
        {
            listingHTML += '           <td><span class="disabled" title="Template is DISABLED">&#10008;</span></td>';
        }

        // generate various parser options
        listingHTML += '' +
            '           <td>' +
            '               <span class="listingOptButtons">' +
            '                   <img src="/static/imgs/icons/edit.svg" title="Edit Template Configuration" alt="Open modal to edit template configuration">' +
            '                   <img src="/static/imgs/icons/delete.svg" title="Delete Template" alt="Delete given template permanently">' +
            '               </span>' +
            '           </td>';

        listingHTML +=
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

    var contentHTML = titleHTML +
        '<div id="primaryContentData" class="contentModule">' +
        '   <div id="tuningOptsWrapper" class="moduleDataWrapper">' +
        '       <h2 class="title subtitle">Parsing Options</h2>' +
        '       <div class="optWrapper configs">' +
                Tuning.prototype.generateMiscParsingOptHTML(
                    tuningDataset.cfg.parsing.sleepTime,
                    tuningDataset.cfg.parsing.numSleepsBetweenStats,
                    tuningDataset.cfg.parsing.logTTL,
                    tuningDataset.cfg.parsing.maxLogsToParse,
                    tuningDataset.cfg.parsing.enableHazyStateTracking,
                    tuningDataset.cfg.state_tracking.stateTrackingWaitNumLogs
                    ) +
        '       </div>' +
        '       <div class="optWrapper">' +
        '       ' + Tuning.prototype.generateTemplateListingHTML(tuningDataset.template) +
        '       </div>' +
        '       <div class="optWrapper">' +
        '       ' + Tuning.prototype.generateParserListingHTML(tuningDataset.parser) +
        '       </div>' +
        '       <h2 class="title subtitle">Analysis Options</h2>' +
        '       <div class="optWrapper"></div>' +
        '       <h2 class="title subtitle">Intel Options</h2>' +
        '       <div class="optWrapper"></div>' +
        '       <h2 class="title subtitle">Application Configuration Options</h2>' +
        '       <div class="optWrapper"></div>' +
        '   </div>' +
        '</div>';

    // update content container with html data
    contentWrapper.html(contentHTML);
};

Tuning.prototype.setPostConfigLoadingOptions = function () {
    /*
        Perform any logic needed for AFTER config data has been loaded
     */

    // init timeago fuzzy timestamps
    $('time.fuzzyTimestamp').timeago();

    // init toggle switches
    $('.toggleSwitch').toggles();
};