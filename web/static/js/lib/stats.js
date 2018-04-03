/*
    Inquisition // Celestial // Stats.js

    - JS lib for loading and displaying inquisition stats
 */

"use strict";

var Stats = function () {};

Stats.prototype.loadStats = function (onlyContent, statData, contentWrapper) {
    /*
        Load and display stats to user
     */

    var contentHTML = ' ' +
        '<div id="contentTitleWrapper" class="contentModule">' +
        '   <h1>' + Global.normalizeTitle('stats') + '</h1>' +
        '</div>' +
        '<div id="primaryContentData" class="contentModule standaloneAlertWrapper">';

    contentHTML += '' +
        '   </div>'  +
        '</div>';

    // update content container with html data
    contentWrapper.html(contentHTML);
};