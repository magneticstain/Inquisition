/*
    Inquisition // Celestial // Mystic.js

    - JS lib for loading remote data via API calls and any other public controller-related functions
 */

"use strict";

var Mystic = function () {};

Mystic.queryAPI = function (httpMethod, apiURL, timeout, data, successFunction, errorFunction, beforeSendFunction) {
    /*
        Make AJAX request to Inquisition API with given params
     */

    $.ajax({
        dataType: 'json',
        type: httpMethod,
        url: apiURL,
        data: data,
        beforeSend: beforeSendFunction,
        success: successFunction,
        error: errorFunction,
        timeout: timeout
    });
};

Mystic.initAPILoad = function (contentWrapper, httpMethod, apiUrl, fadeOutFunct, fadeInFunct, timeout, onlyContent,
                                   initialHtml, orderByFieldOpts, postData) {
    /*
        Abstraction class for making API call and performing before and after functionality
     */

    if(orderByFieldOpts == null)
    {
        // to prevent index errors
        orderByFieldOpts = [];
    }

    var orderByField = orderByFieldOpts[0],
        orderByPlacementKey = orderByFieldOpts[1];

    Mystic.queryAPI(httpMethod, apiUrl, timeout, postData, function (apiData) {
        contentWrapper.fadeOut(250, function () {
            try {
                fadeOutFunct(apiData, contentWrapper, initialHtml, onlyContent, orderByField, orderByPlacementKey);
            } catch (e) {
                ErrorBot.generateError(3, 'issue initiating API call for data :: [ ' + e + ' ]');
            }
        }).fadeIn(250, function () {
            try {
                fadeInFunct(onlyContent);
            } catch (e) {
                ErrorBot.generateError(3, 'issue processing fetched data :: [ ' + e + ' ]');
            }
        });
    }, function () {
        ErrorBot.generateError(4, 'could not load data from the Inquisition API :: [ REQUEST DETAILS: { ' + httpMethod
            + ' ' + apiUrl + ' } ]');
    });
};
