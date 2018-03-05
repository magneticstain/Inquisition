/*
    Inquisition // Celestial // Alerts.js

    - JS lib for data manipulation and front-end controller portion of MVC framework
 */

"use strict";

var Alerts = function () {
    this.primaryDataWrapperElmt = $('#primaryContentData');
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
            '           <td>' + alert.created + '</td>' +
            '           <td>' + alert.host + '</td>' +
            '           <td>' + alert.src_node + '</td>' +
            '           <td>' + alert.dst_node + '</td>' +
            '           <td>' + alert.alert_detail + '</td>' +
            '       </tr>' +
            '       <tr class="alertLogDetails">' +
            '           <td colspan="7">' +
            '               <div class="logDetailHeading">' +
            '                   <p>Log Details</p>' +
            '               </div>' +
            '               <div class="logDetail">' +
            '                    ' + alert.log_data +
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
        var alertFieldName = $(this).attr('data-sort-field-name');
        var alertLimit = $('.alertListingOptions .option.selected').text();

        // check order placement and switch it
        var alertOrderPlacement = $('#primaryContentData').data('alert_order_placement');
        if(alertOrderPlacement === 'asc')
        {
            alertOrderPlacement = 'desc';
        }
        else
        {
            // if here, we're either switching desc or setting the default
            alertOrderPlacement = 'asc';
        }

        Alerts.performPostAlertLoadOptionProcessing('order_by', alertFieldName, alertFieldName, alertOrderPlacement,
            alertLimit, '.contentHeader th', '.alertField-' + alertFieldName);
    });
};