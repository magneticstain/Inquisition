/*
    Inquisition // Celestial // Alerts.js

    - JS lib for data manipulation and front-end controller portion of MVC framework
 */

"use strict";

var Alerts = function () {};

Alerts.prototype.loadSingleAlert = function (onlyContent, alertData, contentWrapper, contentHTMLTop) {
    /*
        Process details to generate html for and load single alert
     */

    var alert = alertData.data[0];

    var contentHTML = ' ' +
        '<div id="contentTitleWrapper" class="contentModule">' +
        '   <h1>' + Global.normalizeTitle('Alert #' + alert.alert_id) + '</h1>' +
        '</div>' +
        '<div class="standaloneAlertOpts contentModule">' +
        '   <a href="/alerts/">&larr; Back to Alerts</a>' +
        '</div>' +
        '<div id="primaryContentData" class="contentModule standaloneAlertContainerWrapper">' +
        '   <div id="standaloneAlertContainer">';

    // alert details present; generate html
    var alertDetailDataset = [
        [ 'Summary', Global.normalizeTitle(alert.alert_detail) ],
        [ 'Created', '<time class="fuzzyTimestamp" title="' + alert.created + '" datetime="' + alert.created + '">' + alert.created + '</time>' ],
        [ 'Last Updated', '<time class="fuzzyTimestamp" title="' + alert.updated + '" datetime="' + alert.updated + '">' + alert.updated + '</time>' ],
        [ 'Host', alert.host ],
        [ 'Source IP/Hostname', alert.src_node ],
        [ 'Destination IP/Hostname', alert.dst_node ]
    ];
    alertDetailDataset.forEach(function (detail) {
        contentHTML += '' +
            '       <div class="wrapperAlertDetail">' +
            '           <p class="alertDetailFieldName">' + detail[0] + ':</p>' +
            '           <p class="alertDetailVal">' + detail[1] + '</p>' +
            '       </div>';
    });

    // append log details as it's a special case
    contentHTML += '' +
        '       <div class="wrapperAlertDetail">' +
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
        Perform any post-processing logic; meant to be performed after the standalone alert details have been loaded
     */

    // update page title with alert ID
    var alertID = Global.getIdentifierFromURL();
    document.title = 'Alert #' + alertID + ' - Inquisition';
};

Alerts.prototype.loadAlerts = function (onlyContent, apiData, contentWrapper, contentHTMLTop, orderByField,
                                        orderByPlacement) {
    /*
        Fetch alert data and insert it into given content wrapper
     */

    var contentHTML = '';
    var availableAlertFieldNames = [
        ['alert_type', 'TYPE'],
        ['alert_id', 'ALERT ID'],
        ['created', 'CREATED'],
        ['updated', 'LAST UPDATED'],
        ['host', 'HOST'],
        ['src_node', 'SOURCE'],
        ['dst_node', 'DESTINATION'],
        ['alert_detail', 'SUMMARY']
        ];

    if(!onlyContent)
    {
        contentHTML += contentHTMLTop +
            '<div id="primaryContentData" class="contentModule">';
    }

    // data table header
    contentHTML += '' +
        '   <table class="contentTable">' +
        '       <thead>' +
        '       <tr class="contentHeader">';

    // generate alerts header html
    availableAlertFieldNames.forEach(function (fieldNameData) {
        // check if currently selected order by field
        var addlClasses = '';
        var orderByIconHTML = '';
        if(fieldNameData[0] === orderByField)
        {
            addlClasses = ' selected';

            // check order of results to see which arrow to use
            if(orderByPlacement === 'asc')
            {
                orderByIconHTML = '<img class="placementIcon" src="/static/imgs/icons/up_arrow.png">';
            }
            else
            {
                orderByIconHTML = '<img class="placementIcon" src="/static/imgs/icons/down_arrow.png">';
            }
        }

        contentHTML += '' +
        '           <th data-sort-field-name="' + fieldNameData[0] + '" class="alertField-' + fieldNameData[0]
            + addlClasses + '">' + orderByIconHTML + '<span>' + fieldNameData[1] + '</span></th>';
    });

    contentHTML += '' +
        '       </tr>' +
        '       </thead>' +
        '       <tbody>';

    // concatonate data rows
    apiData.data.forEach(function (alert) {
        contentHTML += '' +
            '       <tr class="alert">' +
            '           <td>' + alert.alert_type + '</td>' +
            '           <td>' + alert.alert_id + '</td>' +
            '           <td><time class="fuzzyTimestamp" title="' + alert.created + '" datetime="' + alert.created + '"></time></td>' +
            '           <td><time class="fuzzyTimestamp" title="' + alert.updated + '" datetime="' + alert.updated + '"></time></td>' +
            '           <td>' + alert.host + '</td>' +
            '           <td>' + alert.src_node + '</td>' +
            '           <td>' + alert.dst_node + '</td>' +
            '           <td>' + alert.alert_detail + '</td>' +
            '       </tr>' +
            '       <tr class="alertLogDetails">' +
            '           <td colspan="' + availableAlertFieldNames.length + '">' +
            '               <div class="logDetailsWrapper">' +
            '                   <div class="logDetailHeading">' +
            '                       <p>Log Details</p>' +
            '                   </div>' +
            '                   <div class="logDetail">' +
            '                       ' + alert.log_data +
            '                   </div>' +
        '                   </div>' +
            '               <div class="viewAlertWrapper">' +
            '                   <a href="/alert/' + alert.alert_id + '" title="View full alert details">View Alert Details &rarr;</a>' +
            '               </div>' +
            '           </td>' +
            '       </tr>';
    });

    // cap existing html containers
    contentHTML += '' +
        '       </tbody>' +
        '   </table>';

    if(!onlyContent)
    {
        contentHTML += ''  +
            '</div>';
    }

    // update content container with html data
    contentWrapper.html(contentHTML);

    // set global data var for order by placement val
    $('#primaryContentData').data('alert_order_placement', orderByPlacement);
};

Alerts.performPostAlertLoadOptionProcessing = function (cookieKey, newValue, orderBy, orderByPlacement, limit,
                                                        elmntBaseClass, elmntSelectedClass) {
    /*
        Perform post-processing when user has initiated clicks on alerts option selectors
     */

    var primaryDataWrapperElmt = $('#primaryContentData');

    // update cookie settings
    $.cookie(cookieKey, newValue);
    $.cookie('alert_order_placement', orderByPlacement);

    // update url with new limit val
    history.pushState('Alerts', 'Alerts - Inquisition', '/alerts/?o=' + orderBy + '&p=' + orderByPlacement
        + '&l=' + limit);

    Global.setActiveElement(elmntBaseClass, elmntSelectedClass);

    Controller.initLoadingModal(primaryDataWrapperElmt, 'large');
    Controller.initContent(true, primaryDataWrapperElmt, 'alerts', limit, [orderBy, orderByPlacement]);
};

Alerts.prototype.setPostAlertLoadingOptions = function (onlyContent) {
    /*
        Sets various event listeners, etc for after alerts have been loaded

        Should only be used after running loadAlerts()
     */

    // init timeago fuzzy timestamps
    $('time.fuzzyTimestamp').timeago();

    // set event listener for alert details
    $('.alert').click(function () {
        var selectedAlertClass = 'activeAlert';

        if(!$(this).hasClass(selectedAlertClass))
        {
            $(this).addClass(selectedAlertClass);
        } else {
            $(this).removeClass(selectedAlertClass)
        }

        // add event listener to display alert log details
        $(this).next().toggle();
    });

    // add listener for limit and sort options if needed
    if(!onlyContent) {
        $('.option').click(function () {
            // check to see if already selected
            if($(this).hasClass('selected'))
            {
                return;
            }

            var alertFieldName = $('.contentHeader th.selected').attr('data-sort-field-name');
            var alertOrderPlacement = $('#primaryContentData').data('alert_order_placement');
            var alertLimit = $(this).text();
            // convert 'All' option to int representation
            if(alertLimit === 'All')
            {
                alertLimit = 0;
            }

            Alerts.performPostAlertLoadOptionProcessing('content_limit', alertLimit, alertFieldName,
                alertOrderPlacement, alertLimit, '.option', '.alertShow' + alertLimit)
        });
    }

    // add listener for sorting by headers
    $('.contentHeader th').click(function () {
        var newAlertFieldName = $(this).attr('data-sort-field-name');
        var currentAlertFieldName = $('.contentHeader th.selected').attr('data-sort-field-name');
        var alertLimit = $('.alertListingOptions .option.selected').text();

        // check order placement and switch it
        var alertOrderPlacement = $('#primaryContentData').data('alert_order_placement');
        if(newAlertFieldName === currentAlertFieldName)
        {
            if (alertOrderPlacement === 'asc') {
                alertOrderPlacement = 'desc';
            }
            else {
                // if here, we're either switching desc or setting the default
                alertOrderPlacement = 'asc';
            }
        }

        Alerts.performPostAlertLoadOptionProcessing('order_by', newAlertFieldName, newAlertFieldName, alertOrderPlacement,
            alertLimit, '.contentHeader th', '.alertField-' + newAlertFieldName);
    });
};