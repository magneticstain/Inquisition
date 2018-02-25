/*
    Inquisition // Celestial // Controller.js

    - JS lib for controller functions in context of MVC framework
 */

"use strict";

var Controller = function () {};

Controller.initLoadingModal = function (container, modalSize) {
    /*
        Update HTML of given container with loading modal
     */

    var moduleHTML = '' +
        '<div class="loadingModuleContainer blockCenter">' +
        '   <div class="' + modalSize + ' loadingModule">' +
        '       <img src="/static/imgs/icons/loading.svg" alt="Loading content..." title="Loading content, please wait...">' +
        '       <p class="fancyHeading">loading, please wait...</p>' +
        '   </div>' +
        '</div>';

    container.html(moduleHTML);
};

Controller.initContent = function (onlyContent, contentWrapper, contentKey, contentLimit) {
    /*
        Load HTML for content based on given content key
     */

    if(contentLimit === undefined)
    {
        // GET var overrides cookie val, so check for that first
        var GETVarContentLimit = Global.fetchGETVar('limit');
        if(GETVarContentLimit !== '') {
            contentLimit = parseInt(GETVarContentLimit);
        } else {
            // try checking for cookie val that's set
            var cookieContentLimit = $.cookie('content_limit');
            if(cookieContentLimit !== undefined) {
                contentLimit = parseInt(cookieContentLimit);
            } else {
                contentLimit = 50;
            }
        }
    }

    var normalizedContentKey = contentKey.toLowerCase();
    var apiEndpointAndParams = '';
    var optionsHTML = '';
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

            // set API endpoint
            apiEndpointAndParams = 'alerts/?l=' + contentLimit;

            var availableAlertLimits = [50, 250, 500, 0];
            optionsHTML = '' +
                '<div class="alertListingOptions contentModule">' +
                '   <span>Show: ';
            availableAlertLimits.forEach(function (alertLimit, idx) {
                if(idx !== 0) {
                    optionsHTML += ' | ';
                }

                // see if this option should be selected as the current limit
                var selectedClass = '';
                if(alertLimit === contentLimit) {
                    selectedClass = ' selected';
                }

                optionsHTML += '<p class="option alertShow' + alertLimit + selectedClass + '">';
                if(alertLimit === 0) {
                    optionsHTML += 'All';
                } else {
                    optionsHTML += alertLimit;
                }
                optionsHTML += '</p>';
            });
            optionsHTML += '</span>' +
                '</div>';

            // set fade out and fade in callback functions
            var alerts = new Alerts();
            fadeOutFunct = alerts.loadAlerts;
            fadeInFunct = alerts.setPostAlertLoadingOptions;

            break;
    }

    Global.setActiveElement('.navOption', '.' + normalizedContentKey);

    var titleHTML = ' ' +
        '<div id="contentTitleWrapper" class="contentModule">' +
        '   <h1>' + Global.normalizeTitle(normalizedContentKey) + '</h1>' +
        '</div>';

    Mystic.initAPILoad(onlyContent, contentWrapper, 'GET', '/api/v1/' + apiEndpointAndParams, fadeOutFunct, fadeInFunct,
        20000, titleHTML + optionsHTML);
};