/*
    Inquisition // Celestial // Global.js

    - JS lib for globally-used general functions
 */

"use strict";

var Global = function () {};

Global.prototype.queryGlobalAccessData = function (action, moduleName, key, data) {
    /*
        Save given dataset - in JSON-encoded format - to global elmt
    */

    var paramMissing = false,
        paramName = '',
        dataset = data || {};
    if(action == null)
    {
        paramMissing = true;
        paramName = 'action';
    }
    if(moduleName == null)
    {
        paramMissing = true;
        paramName = 'module name';
    }
    if(key == null)
    {
        paramMissing = true;
        paramName = 'key';
    }
    if(paramMissing)
    {
        throw 'no ' + paramName + ' provided during global data query';
    }

    var targetElmnt = $('#' + moduleName);
    switch (action.toLowerCase())
    {
        case 'get':
            try {
                return JSON.parse(targetElmnt.data(key));
            } catch (e) {
                ErrorBot.generateError(0, 'cannot parse global app data object');
                return false;
            }

        case 'set':
            targetElmnt.data(key, JSON.stringify(dataset));
            return true;
        default:
            throw 'invalid action provided during global data query :: [ ' + action + ' ]';
    }
};

Global.normalizeTitle = function (contentTitle, allowUnderscores) {
    /*
        Format content title in titlecase
     */

    var title = '';

    if(contentTitle == null)
    {
        throw 'no string provided for title normalization';
    }
    else
    {
        if(allowUnderscores == null || !allowUnderscores)
        {
            contentTitle = contentTitle.replace(/_/g, ' ');
        }

        var titleClauses = contentTitle.split(' ');
    }

    titleClauses.forEach(function (clause) {
        if(title)
        {
            title += ' ';
        }

        title += clause.charAt(0).toUpperCase() + clause.slice(1);
    });

    return title;
};

Global.setActiveElement = function (baseClass, contentKeyClass) {
    /*
        Set active item based on content key
     */

    var selectionDesignationClass = 'selected';

    $(baseClass).removeClass(selectionDesignationClass);
    $(baseClass + contentKeyClass).addClass(selectionDesignationClass);
};

Global.initFuzzyTimestamps = function () {
    /*
        Initialize and run any addl logic needed for displaying fuzzy timestamps in the view
     */

    // currently using the timeago.js plugin
    // https://timeago.yarp.com/
    $('time.fuzzyTimestamp').timeago();
};

Global.prototype.convertTimestampToISO9601 = function (timestamp, timezoneExplicitlySet) {
    /*
        Convert given timestamp to ISO 8601 format, a requirement for use with the timeago plugin for fuzzy timestamps
     */

    if(timezoneExplicitlySet !== true)
    {
        // all timestamps on the backend SHOULD be in UTC/GMT timezone
        // timezone is needed since Date() uses the local timezone if not, resulting in inaccurate results
        timestamp += ' GMT';
    }

    var date = new Date(timestamp);

    return date.toISOString();
};

Global.getContentKeyFromCleanURL = function () {
    /*
        Get content key when using clean URLs

            - when not using clean URLs, you should use fetGETVar on 'content'
     */

    var contentKey = window.location.pathname.match('\/([A-Za-z0-9]+)\/?');

    if(contentKey === null) {
        // no match found, set default
        contentKey = 'alerts';
    } else {
        contentKey = contentKey[1];
    }

    return contentKey;
};

Global.getIdentifierFromURL = function () {
    /*
        Fetches and returns the unique identifier from the browser URL
     */

    var identifier = window.location.pathname.match('\/([0-9]+)\/?$');

    if(identifier == null)
    {
        identifier = 0;
    } else {
        identifier = identifier[1];
    }

    return identifier;
};

Global.fetchGETVar = function (varName) {
    /*
        Retrieve given GET variable via browser URL
     */

    var GETVars = window.location.search.substring(1).split('&'),
        GETVarVal = '';

    GETVars.forEach(function (GETVar) {
        var GETVarKeyValPair = GETVar.split('=');
        if(GETVarKeyValPair[0] === varName) {
            GETVarVal = GETVarKeyValPair[1];
        }
    });

    return GETVarVal;
};