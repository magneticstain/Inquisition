/*
    Inquisition // Celestial // Alerts.js

    - JS lib for data manipulation and front-end controller portion of MVC framework
 */

"use strict";

var Alerts = function () {};

Alerts.prototype.loadAlerts = function (onlyContent, apiData, contentWrapper, contentHTMLTop) {
    /*
        Fetch alert data and insert it into given content wrapper
     */

    var contentHTML = '';

    if(!onlyContent)
    {
        contentHTML += contentHTMLTop +
            '<div id="primaryContentData" class="contentModule">';
    }

    // data table header
    contentHTML += '' +
        '   <table class="contentTable">' +
        '       <thead>' +
        '       <tr class="contentHeader">' +
        '           <th>TYPE</th>' +
        '           <th>ALERT ID</th>' +
        '           <th>CREATED</th>' +
        '           <th>HOST</th>' +
        '           <th>SOURCE</th>' +
        '           <th>DESTINATION</th>' +
        '           <th>SUMMARY</th>' +
        '       </tr>' +
        '       </thead>' +
        '       <tbody>';

    // concatonate data rows
    apiData.data.forEach(function (alert) {
        contentHTML += '' +
            '       <tr class="alert">' +
            '           <td>' + alert.alert_type_name + '</td>' +
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

    // add listener for limit options if needed
    if(!onlyContent) {
        $('.option').click(function () {
            // check to see if already selected
            if($(this).hasClass('selected'))
            {
                return;
            }

            var limit = $(this).text();
            // convert 'All' option to int representation
            if(limit === 'All')
            {
                limit = 0;
            }

            // update cookie setting
            $.cookie('content_limit', limit);

            // update url with new limit val
            history.pushState('Alerts', 'Alerts - Inquisition', '/alerts/?limit=' + limit);

            Global.setActiveElement('.option', '.alertShow' + limit);

            var priContentContainerPointer = $('#primaryContentData');
            Controller.initLoadingModal(priContentContainerPointer, 'large');
            Controller.initContent(true, priContentContainerPointer, 'alerts', limit);
        });
    }
};