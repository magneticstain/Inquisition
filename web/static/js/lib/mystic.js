/*
    Inquisition // Celestial // Mystic.js

    - JS lib for data generation and manipulation
 */

"use strict";

var Mystic = function () {};

Mystic.queryAPI = function (httpMethod, apiURL, timeout, data,
                            successFunction, errorFunction, beforeSendFunction) {
    /*
        Make AJAX request to Inquisition API with given params
     */

    $.ajax({
        type: httpMethod,
        url: apiURL,
        data: data,
        beforeSend: beforeSendFunction,
        success: successFunction,
        error: errorFunction,
        timeout: timeout
    });
};

Mystic.initAPILoad = function (onlyContent, contentWrapper, httpMethod, apiUrl, fadeOutFunct, fadeInFunct,
                               timeout, initialHtml, postData) {
    /*
        Abstraction class for making API call and performing before and after functionality
     */

    Mystic.queryAPI(httpMethod, apiUrl, timeout, postData, function (apiData) {
        contentWrapper.fadeOut(250, function () {
            try {
                fadeOutFunct(onlyContent, apiData, contentWrapper, initialHtml);
            } catch (e) {
                ErrorBot.generateError(3, e);
            }
        }).fadeIn(250, function () {
            try {
                fadeInFunct(onlyContent);
            } catch (e) {
                ErrorBot.generateError(3, e);
            }
        });
    }, function () {
        ErrorBot.generateError(4, 'could not load data from the Inquisition API :: [ REQUEST DETAILS: { ' + httpMethod + ' ' + apiUrl + ' } ]');
    });
};
