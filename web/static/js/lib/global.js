/*
    Inquisition // Celestial // Global.js

    - JS lib for globally used functions
 */

"use strict";

var Global = function () {};

Global.normalizeTitle = function (contentTitle) {
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

Global.setActiveElement = function (baseClass, contentKeyClass) {
    /*
        Set active item based on content key
     */

    var selectionDesignationClass = 'selected';

    $(baseClass).removeClass(selectionDesignationClass);
    $(baseClass + contentKeyClass).addClass(selectionDesignationClass);
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