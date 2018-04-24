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

Controller.getContentConstraints = function (GETVarKey, defaultVal, cookieKey) {
    /*
        Load content constraint from key
     */

    var constraintVal = '';

    if(cookieKey == null)
    {
        cookieKey = GETVarKey;
    }

    // GET var overrides cookie val, so check for that first
    var constraintGETVar = Global.fetchGETVar(GETVarKey);
    if(constraintGETVar !== '') {
        constraintVal = constraintGETVar;
    } else {
        // try checking for cookie val that's set
        var constraintCookie = $.cookie(cookieKey);
        if(constraintCookie != null) {
            constraintVal = constraintCookie;
        } else {
            constraintVal = defaultVal;
        }
    }

    return constraintVal;
};

Controller.initContent = function (onlyContent, contentWrapper, contentKey, contentLimit, contentSortFieldOpts) {
    /*
        Load HTML for content based on given content key
     */

    var alerts = new Alerts();
    var stats = new Stats();
    var tuning = new Tuning();
    var normalizedContentKey = contentKey.toLowerCase();
    var apiEndpointAndParams = '';
    var titleHTML = '';
    var optionsHTML = '';
    var fadeOutFunct = function () {};
    var fadeInFunct = function () {};
    if(contentLimit == null)
    {
        contentLimit = parseInt(this.getContentConstraints('l', 50, 'content_limit'));
    }

    if(contentSortFieldOpts == null)
    {
        contentSortFieldOpts = [ this.getContentConstraints('o', 'alert_id', 'order_by'),
            this.getContentConstraints('p', 'asc', 'alert_order_placement') ];
    }

    // set vars based on type of content we have to load
    switch (normalizedContentKey) {
        case 'alert':
            // get alert ID
            var alertID = parseInt(Global.getIdentifierFromURL());

            // format api call
            apiEndpointAndParams = 'alerts/?i=' + alertID + '&l=1';

            fadeOutFunct = alerts.loadSingleAlert;
            fadeInFunct = alerts.setPostStandalonAlertLoadOpts;

            break;
        case 'stats':
            // format api call
            apiEndpointAndParams = 'stats/';

            fadeOutFunct = stats.loadStats;
            fadeInFunct = stats.prepCharts;

            break;
        case 'tuning':
            // format api call
            apiEndpointAndParams = 'tuning/?t=all';

            fadeOutFunct = tuning.loadTuningConfiguration;
            fadeInFunct = tuning.setPostConfigLoadingOptions;

            break;
        default:
            // default option is always alerts
            // overwrite content key if necessary
            normalizedContentKey = 'alerts';

            // set API endpoint
            apiEndpointAndParams = 'alerts/?o=' + contentSortFieldOpts[0]
                + '&p=' + contentSortFieldOpts[1] + '&l=' + contentLimit;

            // build alert limit options html
            var availableAlertLimits = [50, 250, 500, 0];
            optionsHTML = '' +
                '<div class="contentOptions contentModule">' +
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
            optionsHTML += '' +
                '   </span>' +
                '</div>';

            fadeOutFunct = alerts.loadAlerts;
            fadeInFunct = alerts.setPostAlertLoadingOptions;

            break;
    }

    Global.setActiveElement('.navOption', '.' + normalizedContentKey);

    if(titleHTML === '')
    {
        // set title HTML to default format
        titleHTML = ' ' +
            '<div id="contentTitleWrapper" class="contentModule">' +
            '   <h1 class="title">' + Global.normalizeTitle(normalizedContentKey) + '</h1>' +
            '</div>';
    }

    Mystic.initAPILoad(onlyContent, contentWrapper, 'GET', '/api/v1/' + apiEndpointAndParams, fadeOutFunct, fadeInFunct,
        20000, titleHTML + optionsHTML, contentSortFieldOpts);
};