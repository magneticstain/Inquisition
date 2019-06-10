/*
    Inquisition // Celestial // Controller.js

    - JS lib for internal controller functions in context of MVC framework
 */

'use strict';

var Controller = function (contentWrapper, contentKey) {
    this.contentWrapper = contentWrapper;
    this.contentKey = contentKey;
    this.fadeOutFunct = function () {};
    this.fadeInFunct = function () {};
};

Controller.prototype.getContentConstraints = function (defaultVal, GETVarKey, cookieKey) {
    /*
        Load content constraint from key, either via GET var or cookie
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

Controller.prototype.initContent = function (contentWrapper, contentKey, contentLimit, contentSortFieldOpts,
                                             onlyContent) {
    /*
        Load HTML for content based on given content key

        Works by:
            1) Defining logic based on content key
            2) Running the fadeOut/fadeIn functions to load the content
     */

    contentWrapper = contentWrapper || this.contentWrapper;
    contentKey = contentKey || this.contentKey;
    contentLimit = contentLimit || parseInt(this.getContentConstraints(50, 'l', 'content_limit'));
    contentSortFieldOpts = contentSortFieldOpts || [
        this.getContentConstraints('alert_id', 'o', 'order_by'),
        this.getContentConstraints('asc', 'p', 'alert_order_placement')
    ];

    var alerts = new Alerts(),
        stats = new Stats(),
        tuning = new Tuning(),
        apiEndpointAndParams = '',
        optionsHTML = '';

    // set vars based on type of content we have to load
    switch (contentKey) {
        case 'alert':
            // get alert ID
            var alertID = parseInt(Global.getIdentifierFromURL());

            // format api call
            apiEndpointAndParams = 'alerts/?i=' + alertID + '&l=1';

            this.fadeOutFunct = alerts.loadSingleAlert;
            this.fadeInFunct = alerts.setPostStandalonAlertLoadOpts;

            break;
        case 'stats':
            // format api call
            apiEndpointAndParams = 'stats/';

            this.fadeOutFunct = stats.loadStats;
            this.fadeInFunct = stats.prepCharts;

            break;
        case 'tuning':
            // format api call
            apiEndpointAndParams = 'tuning/?t=all';

            this.fadeOutFunct = tuning.loadTuningConfiguration;
            this.fadeInFunct = tuning.runPostConfigLoad;

            break;
        case 'alerts':
        default:
            // default option is always alerts
            // override content key in case this is triggered as the 'default' behavior
            contentKey = 'alerts';

            apiEndpointAndParams = 'alerts/?o=' + contentSortFieldOpts[0]
                + '&p=' + contentSortFieldOpts[1] + '&l=' + contentLimit;

            // build alert limit options html
            var availableAlertLimits = [ 50, 250, 500, 0 ],
                selectedClass = '';

            optionsHTML = '' +
                '<div class="contentOptions contentModule">' +
                '   <span>Show: ';

            // traverse and generate html for each alert limit available
            availableAlertLimits.forEach(function (alertLimit, idx) {
                if(idx !== 0) {
                    optionsHTML += ' | ';
                }

                // check if this option should be selected as the current limit
                selectedClass = '';
                if(alertLimit === contentLimit) {
                    selectedClass = ' selected';
                }

                // append combined html for option to collective option html
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

            this.fadeOutFunct = alerts.loadAlerts;
            this.fadeInFunct = alerts.setPostAlertLoadingOptions;

            break;
    }

    Global.setActiveElement('.navOption', '.' + contentKey);

    // load data for user
    var titleHTML = '' +
        '<div id="contentTitleWrapper" class="contentModule">' +
        '   <h1 class="title">' + Global.normalizeTitle(contentKey) + '</h1>' +
        '</div>';
    Mystic.initAPILoad(contentWrapper, 'GET', '/api/v1/' + apiEndpointAndParams, this.fadeOutFunct, this.fadeInFunct,
        20000, onlyContent, titleHTML + optionsHTML, contentSortFieldOpts);
};