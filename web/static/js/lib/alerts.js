/*
    Inquisition // Celestial // Alerts.js

    - JS lib for data manipulation and front-end controller portion of MVC framework
 */

'use strict';

var Alerts = function () {
    Module.call(this);
};

Alerts.getAvailableFieldNames = function () {
    /*
        Return array of all field names - in [ DB COLN NAME , CANONICAL NAME ] format - available for alerts
     */

    return [
        ['alert_type', 'TYPE'],
        ['alert_id', 'ALERT ID'],
        ['created', 'CREATED'],
        ['updated', 'LAST UPDATED'],
        ['host', 'HOST'],
        ['src_node', 'SOURCE'],
        ['dst_node', 'DESTINATION'],
        ['alert_detail', 'SUMMARY']
    ];
};

// Single Alert Functs
Alerts.prototype.loadSingleAlert = function (alertData, contentWrapper) {
    /*
        Process details to generate html for and load single alert
     */

    var alert = alertData.data[0];

    // generate header and opts html
    var contentHTML = ' ' +
        '<div id="contentTitleWrapper" class="contentModule">' +
        '   <h1 class="title">' + Global.normalizeTitle('Alert #' + alert.alert_id) + '</h1>' +
        '</div>' +
        '<div class="standaloneAlertOpts contentModule">' +
        '   <a href="/alerts/">&larr; Back to Alerts</a>' +
        '</div>' +
        '<div id="primaryContentData" class="contentModule standaloneAlertWrapper">' +
        '   <div id="standaloneAlertContents">';

    // generate html for details of alert
    // details format is [ key/title, val ]
    var alertDetailDataset = [
        [ 'Summary', Global.normalizeTitle(alert.alert_detail) ],
        [ 'Created', '<time class="fuzzyTimestamp" title="' + alert.created + '" datetime="' + alert.created + '">'
            + alert.created + '</time>' ],
        [ 'Last Updated', '<time class="fuzzyTimestamp" title="' + alert.updated + '" datetime="' + alert.updated + '">'
            + alert.updated + '</time>' ],
        [ 'Host', alert.host ],
        [ 'Source IP/Hostname', alert.src_node ],
        [ 'Destination IP/Hostname', alert.dst_node ]
    ];
    alertDetailDataset.forEach(function (detail) {
        contentHTML += '' +
            '       <div class="alertKeyValWrapper">' +
            '           <p class="alertDetailFieldName">' + detail[0] + ':</p>' +
            '           <p class="alertDetailVal">' + detail[1] + '</p>' +
            '       </div>';
    });

    // append log detail html
    contentHTML += '' +
        '       <div class="alertKeyValWrapper">' +
        '           <p class="alertDetailFieldName">Log Details:</p>' +
        '           <div class="alertDetailVal logDetail">' + alert.log_data + '</div>' +
        '       </div>';

    contentHTML += '' +
        '   </div>'  +
        '</div>';

    // update content container with html data
    contentWrapper.html(contentHTML);
};

Alerts.prototype.setPostStandalonAlertLoadOpts = function () {
    /*
        Perform any post-processing logic; meant to be performed after loadSingleAlert() has been ran
     */

    // update page title with alert ID noted
    var alertID = Global.getIdentifierFromURL();
    document.title = 'Alert #' + alertID + ' - Inquisition';
};

// Multiple Alerts Functs
// loading functions
Alerts.prototype.generateAlertsTableHeaderHTML = function (orderByField, orderByPlacement) {
    /*
        Generate and return HTML for the header row of the alerts listings table
     */

    var headerHTML = '';

    Alerts.getAvailableFieldNames().forEach(function (fieldNameData) {
        var addlClasses = '',
            orderByIconPath = '',
            orderByIconHTML = '',
            alertFieldKey = fieldNameData[0],
            alertFieldVal = fieldNameData[1];

        // check if currently selected order by field
        if(alertFieldKey === orderByField) {
            addlClasses = ' selected';

            // check order of results to see which arrow to use
            if(orderByPlacement === 'asc') {
                orderByIconPath = '/static/imgs/icons/up_arrow.png';
            } else {
                orderByIconPath = '/static/imgs/icons/down_arrow.png';
            }
            orderByIconHTML = '<img alt="Alert sort order" class="placementIcon" src="' + orderByIconPath + '">';
        }

        headerHTML += '<th data-sort-field-name="' + alertFieldKey + '" class="alertField-' + alertFieldKey
            + addlClasses + '">' + orderByIconHTML + '<span>' + alertFieldVal + '</span></th>';
    });

    return headerHTML;
};

Alerts.prototype.generateAlertsTableListingHTML = function (alertData) {
    /*
        Generate and return HTML for the listings included in the actual alerts listings table
     */

    var listingHTML = '',
        createdTimestamp = '',
        updatedTimestamp = '';

    alertData.data.forEach(function (alert) {
        createdTimestamp = Global.prototype.convertTimestampToISO9601(alert.created);
        updatedTimestamp = Global.prototype.convertTimestampToISO9601(alert.updated);

        listingHTML += '' +
            '<tr class="alert">' +
            '   <td>' + alert.alert_type + '</td>' +
            '   <td>' + alert.alert_id + '</td>' +
            '   <td>' +
            '       <time class="fuzzyTimestamp" title="' + createdTimestamp + '" datetime="' + createdTimestamp + '">' +
            '       </time>' +
            '   </td>' +
            '   <td>' +
            '       <time class="fuzzyTimestamp" title="' + updatedTimestamp + '" datetime="' + updatedTimestamp + '">' +
            '       </time>' +
            '   </td>' +
            '   <td>' + alert.host + '</td>' +
            '   <td>' + alert.src_node + '</td>' +
            '   <td>' + alert.dst_node + '</td>' +
            '   <td>' + alert.alert_detail + '</td>' +
            '</tr>' +
            '<tr class="alertLogDetails">' +
            '   <td colspan="' + Alerts.getAvailableFieldNames().length + '">' +
            '       <div class="logDetailsWrapper">' +
            '           <div class="title logDetailHeading"><p>Log Details</p></div>' +
            '           <div class="logDetail">' + alert.log_data + '</div>' +
            '       </div>' +
            '       <div class="viewAlertWrapper">' +
            '           <a href="/alert/' + alert.alert_id + '" title="View full alert details">' +
            'View Alert Details &rarr;</a>' +
            '       </div>' +
            '   </td>' +
            '</tr>';
    });

    return listingHTML;
};

Alerts.prototype.loadAlerts = function (apiData, contentWrapper, contentHTMLTop, onlyContent, orderByField,
                                        orderByPlacement) {
    /*
        Fetch alert data and insert it into given content wrapper
     */

    var contentHTML = '' +
        '<table class="alertTable">' +
        '   <thead>' +
        '       <tr class="listingHeader">' +
        Alerts.prototype.generateAlertsTableHeaderHTML(orderByField, orderByPlacement) +
        '       </tr>' +
        '   </thead>' +
        '   <tbody>' +
        Alerts.prototype.generateAlertsTableListingHTML(apiData) +
        '   </tbody>' +
        '</table>';

    // if onlyContent isn't requested, encapsulate content within the content data wrapper elmnt
    if(!onlyContent) {
        contentHTML = contentHTMLTop +
            '<div id="primaryContentData" class="contentModule">' +
            contentHTML +
            '</div>';
    }

    // update content container with html data
    contentWrapper.html(contentHTML);

    // set global data var for order by placement val, to be used later by other functions/libraries
    $('#primaryContentData').data('alert_order_placement', orderByPlacement);
};

// post-load functions
Alerts.performPostAlertLoadOptionProcessing = function (cookieKey, newValue, orderBy, orderByPlacement, limit,
                                                        elmntBaseClass, elmntSelectedClass) {
    /*
        Perform post-processing when user has initiated clicks on alerts option selectors
     */

    var alertDataContainer = $('#primaryContentData'),
        appCtrlr = new Controller();

    // update cookie settings
    $.cookie(cookieKey, newValue);
    $.cookie('alert_order_placement', orderByPlacement);

    // update url with new limit val
    history.pushState('Alerts', 'Alerts - Inquisition', '/alerts/?o=' + orderBy + '&p=' + orderByPlacement
        + '&l=' + limit);

    Global.setActiveElement(elmntBaseClass, elmntSelectedClass);

    View.initLoadingModal(alertDataContainer, 'large');

    appCtrlr.initContent(alertDataContainer, 'alerts', limit, [orderBy, orderByPlacement], true);
};

Alerts.prototype.setPostAlertLoadingOptions = function (onlyContent) {
    /*
        Sets various event listeners, etc for after alerts have been loaded

        * Should only be used after running loadAlerts()
     */

    Global.initFuzzyTimestamps();

    // set event listener for displaying alert details
    $('.alert').click(function () {
        var selectedAlertClass = 'activeAlert';

        if(!$(this).hasClass(selectedAlertClass)) {
            $(this).addClass(selectedAlertClass);
        } else {
            $(this).removeClass(selectedAlertClass);
        }

        // add event listener to display alert log details
        $(this).next().toggle();
    });

    // add listener for sorting by headers
    $('.listingHeader th').off().click(function () {
        var newAlertFieldName = $(this).data('sort-field-name'),
            currentAlertFieldName = $('.listingHeader th.selected').data('sort-field-name'),
            alertLimit = $('.contentOptions .option.selected').text(),
            alertOrderPlacement = $('#primaryContentData').data('alert_order_placement');

        // check current order placement and switch it if needed
        if(newAlertFieldName === currentAlertFieldName) {
            if (alertOrderPlacement === 'asc') {
                alertOrderPlacement = 'desc';
            } else {
                // if here, we're either switching desc or setting the default
                alertOrderPlacement = 'asc';
            }
        }

        // perform post-click logic
        Alerts.performPostAlertLoadOptionProcessing('order_by', newAlertFieldName, newAlertFieldName,
            alertOrderPlacement, alertLimit, '.alertTableHeader th', '.alertField-' + newAlertFieldName);
    });

    // add listener for alert limit option if needed
    if(!onlyContent) {
        $('.option').off().click(function () {
            // check to see if already selected
            if($(this).hasClass('selected')) {
                return;
            }

            var alertFieldName = $('.listingHeader th.selected').data('sort-field-name'),
                alertOrderPlacement = $('#primaryContentData').data('alert_order_placement'),
                alertLimit = $(this).text();
            // convert 'All' option to int representation
            if(alertLimit === 'All') {
                alertLimit = 0;
            }

            // perform post-click logic
            Alerts.performPostAlertLoadOptionProcessing('content_limit', alertLimit, alertFieldName,
                alertOrderPlacement, alertLimit, '.option', '.alertShow' + alertLimit);
        });
    }
};