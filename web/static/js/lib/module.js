/*
    Inquisition // Celestial // Module.js

    - Base class for all modules (alerts, stats, etc)
 */

"use strict";

var Module = function (parentDataContainer, contentWrapper, contentKey) {
    Module.parentDataContainer = parentDataContainer || $('#primaryContentData');

    this.controller = new Controller(contentWrapper, contentKey);
};