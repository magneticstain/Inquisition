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

Mystic.prototype.loadContent = function (contentWrapper, contentKey) {
    /*
        Load content HTML based on given content key
     */

    var apiEndpointAndParams = '';
    var loadFunction = function () {};
    var normalizedContentKey = contentKey.toLowerCase();

    // set vars based on type of content we have to load
    switch (normalizedContentKey) {
        case 'stats':
            break;
        case 'tuning':
            break;
        default:
            // default option is always alerts
            normalizedContentKey = 'alerts';

            // api params and callback functions
            apiEndpointAndParams = 'alerts/?l=100';
            loadFunction = function (cw, apiData, contentHTML) {
                // data table header
                contentHTML += '' +
                    '<div id="primaryContentData" class="contentModule">' +
                    '   <div class="contentTable">' +
                    '       <div class="contentHeader contentRow">' +
                    '           <span>TYPE</span>' +
                    '           <span>ALERT ID</span>' +
                    '           <span>CREATED</span>' +
                    '           <span>HOST</span>' +
                    '           <span>SOURCE</span>' +
                    '           <span>DESTINATION</span>' +
                    '           <span>SUMMARY</span>' +
                    '       </div>';

                // concatonate data rows
                apiData.forEach(function (alert) {
                    contentHTML += '' +
                        '       <div class="alert contentRow">' +
                        '           <span>' + alert.alert_type_name + '</span>' +
                        '           <span><a href="#' + alert.alert_id + '" title="View Alert">' + alert.alert_id + '</a></span>' +
                        '           <span>' + alert.created + '</span>' +
                        '           <span>' + alert.host + '</span>' +
                        '           <span>' + alert.src_node + '</span>' +
                        '           <span>' + alert.dst_node + '</span>' +
                        '           <span>' + alert.alert_detail + '</span>' +
                        '       </div>';
                });

                // cap existing html containers
                contentHTML += '' +
                    '   </div>' +
                    '</div>';

                // update content container with html data
                cw.html(contentHTML);
            };

            break;
    }

    var titleHTML = ' ' +
        '<div id="contentTitleWrapper" class="contentModule">' +
        '   <h1>' + Mystic.prototype.normalizeTitle(contentKey) + '</h1>' +
        '</div>';

    Mystic.prototype.setActiveNavOption(normalizedContentKey);

    Mystic.prototype.queryAPI('GET', '/api/v1/' + apiEndpointAndParams, 20000, null, function(apiData){
        // DEV NOTE: we have to run our function within a function dec in order for the callback to function correctly
        contentWrapper.fadeOut(250, function () {
            loadFunction(contentWrapper, apiData, titleHTML)
        }).fadeIn(250);
    }, function () {
        console.log('[ ERROR ] could not load ' + normalizedContentKey + ' data from API');
    });
};
