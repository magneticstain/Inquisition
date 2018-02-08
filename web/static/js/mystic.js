/*
    Inquisition // Celestial // Mystic.css

    - JS lib for data manipulation and front-end controller portion of MVC framework
 */

"use strict";

var Mystic = function(){};

Mystic.prototype.queryAPI = function (httpMethod, apiURL, timeout, data,
                           successFunction, errorFunction, beforeSendFunction) {
    /*
        Make AJAX request to Inquisition API with given params
     */

    $.ajax({
        type: httpMethod,
        url: apiURL,
        data: data,
        beforeSend: beforeSendFunction,
        success: successFunction,
        error: errorFunction,
        timeout: timeout
    });
};

Mystic.prototype.setActiveNavOption = function (contentKey) {
    /*
        Set active nav item based on content key/url hash val
     */

    var selectionDesignationClass = 'selected';

    $('.navOption').removeClass(selectionDesignationClass);
    $('.navOption.' + contentKey).addClass(selectionDesignationClass);
};

Mystic.prototype.normalizeTitle = function (contentTitle) {
    /*
        Format content title in titlecase
     */

    var title = '';

    var titleClauses = contentTitle.toLowerCase().split(' ');

    titleClauses.forEach(function (clause) {
        if(!title)
        {
            title += ' ';
        }

        title += clause.charAt(0).toUpperCase() + clause.slice(1);
    });

    return title;
};

Mystic.prototype.loadAlerts = function (apiData, contentWrapper, contentHTMLTop) {
    /*
        Fetch alert data and insert it into given content wrapper
     */

    var contentHTML = contentHTMLTop;

    // data table header
    contentHTML += '' +
        '<div id="primaryContentData" class="contentModule">' +
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
    apiData.forEach(function (alert) {
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
            '               <div class="logDetail">' +
            '                    ' + alert.log_data +
            '               </div>' +
            '           </td>' +
            '       </tr>';
    });

    // cap existing html containers
    contentHTML += '' +
        '       </tbody>' +
        '   </table>' +
        '</div>';

    // update content container with html data
    contentWrapper.html(contentHTML);
};

Mystic.prototype.loadContent = function (contentWrapper, contentKey) {
    /*
        Load content HTML based on given content key
     */

    var normalizedContentKey = contentKey.toLowerCase();
    var apiEndpointAndParams = '';
    var fadeOutFunct = function () {};
    var fadeInFunct = function () {};

    // set vars based on type of content we have to load
    switch (normalizedContentKey) {
        case 'stats':
            // TODO
            break;
        case 'tuning':
            // TODO
            break;
        default:
            // default option is always alerts

            // overwrite content key if necessary
            normalizedContentKey = 'alerts';

            apiEndpointAndParams = 'alerts/?l=100';

            // set fade out and in callback functions
            fadeOutFunct = this.loadAlerts;
            fadeInFunct = function () {
                $('.alert').click(function () {
                    var selectedAlertClass = 'activeAlert';

                    if(!$(this).hasClass(selectedAlertClass)) {
                        $(this).addClass(selectedAlertClass);
                    } else {
                        $(this).removeClass(selectedAlertClass)
                    }

                    // display alert log details
                    $(this).next().toggle();
                });
            };

            break;
    }

    this.setActiveNavOption(normalizedContentKey);

    var titleHTML = ' ' +
        '<div id="contentTitleWrapper" class="contentModule">' +
        '   <h1>' + Mystic.prototype.normalizeTitle(contentKey) + '</h1>' +
        '</div>';

    this.queryAPI('GET', '/api/v1/' + apiEndpointAndParams, 20000, null, function (apiData) {
        contentWrapper.fadeOut(250, function () {
            fadeOutFunct(apiData, contentWrapper, titleHTML);
        }).fadeIn(250, function () {
            fadeInFunct();
        });
    }, function () {
        console.log('[ ERROR ] could not load ' + normalizedContentKey + ' data from API');
    });
};
