/*
    Inquisition // Celestial // View.js

    - JS lib for view-related functions in context of MVC framework
 */

"use strict";

var View = function () {};

View.initLoadingModal = function (container, modalSize, htmlOnly) {
    /*
        Update HTML of given container with loading modal
     */

    if(modalSize == null)
    {
        modalSize = 'standard';
    }

    var modalHTML = '' +
        '<div class="loadingModalContainer blockCenter">' +
        '   <div class="' + modalSize + ' loadingModal">' +
        '       <img src="/static/imgs/icons/loading.svg" alt="Loading content" title="Loading content, please wait">' +
        '       <p class="fancyHeading">loading, please wait...</p>' +
        '   </div>' +
        '</div>';

    if(htmlOnly)
    {
        return modalHTML;
    }
    else
    {
        // update container with html instead of just returning html
        container.html(modalHTML);
    }

    return true;
};