/*
    Inquisition // Celestial // Global.js

    - JS lib for globally-used functions
 */

"use strict";

var Global = function () {};

Global.prototype.queryGlobalAccessData = function (action, moduleName, key, dataset) {
    /*
        Save given dataset - in JSON-encoded format - to global elmt
    */

    var paramMissing = false,
        paramName = '';
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
    if(dataset == null)
    {
        dataset = [];
    }

    var targetElmnt = $('#' + moduleName);
    switch (action.toLowerCase())
    {
        case 'get':
            return JSON.parse(targetElmnt.data(key));

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

    var GETVars = window.location.search.substring(1).split('&');
    var GETVarVal = '';

    GETVars.forEach(function (GETVar) {
        var GETVarKeyValPair = GETVar.split('=');
        if(GETVarKeyValPair[0] === varName) {
            GETVarVal = GETVarKeyValPair[1];
        }
    });

    return GETVarVal;
};