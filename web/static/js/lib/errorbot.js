/**
 *  Inquisition // Celestial // Errorbot.js
 *
 *  - A JS library for displaying and delivering errors
 *
 *  - SRC: https://github.com/magneticstain/CLTools/blob/master/CLWeb/static/js/errorbot.js
 */

'use strict';

var errorModal = $('#mainErrorModal');

var errorSeverities = [
    'INFO',
    'ERROR',
    'WARN',
    'CRIT',
    'FATAL'
];

var ErrorBot = function(sev, msg){
    this.setMsg(sev, msg);
};

ErrorBot.prototype.setErrorModalHTML = function () {
    /*
        Set HTML of error modal based on message metadata
     */

    // defaut is set to ERROR
    var modalImgHTML = '<img src="/static/imgs/icons/error.svg" alt="ERROR - ' + errorSeverities[this.severity] + '">',
        modalBgColor = '#E64747';

    if(this.severity < 0)
    {
        // message is indicative of a success
        modalImgHTML = '<img src="/static/imgs/icons/success.svg" alt="Request was SUCCESSFUL">';
        modalBgColor = '#47E674';
    }

    errorModal.html(modalImgHTML + '<p>' + this.msg + '</p>');
    errorModal.css('backgroundColor', modalBgColor);
};

ErrorBot.prototype.setMsg = function (severity, msg) {
    // sets characteristics of error
    // severity
    if(typeof severity === 'undefined')
    {
        this.severity = 0;
    }
    else
    {
        this.severity = severity;
    }

    // message
    if(typeof msg !== 'undefined')
    {
        this.msg = msg;
    }
    else
    {
        // set default msg
        this.msg = '| NO MSG SET |';
    }

    this.setErrorModalHTML();
};

ErrorBot.prototype.displayMsg = function (delayTimeMS) {
    /*
        Show error modal and update any main content to reflect the error if needed
     */

    // update any loading modules that are running if msg is no a success message
    if(0 <= this.severity) {
        $('#loadingContainer').replaceWith('' +
            '<div class="errorContainer">' +
            '   <img src="/static/imgs/robot.svg">' +
            '   <p class="fancyHeading">Uh oh - looks like we encountered an error!</p>' +
            '</div>');
    }

    // check if delay time was provided
    if(typeof delayTimeMS === 'undefined')
    {
        // set to default delay time based on severity
        delayTimeMS = 1500;
        if(0 <= this.severity)
        {
            // increase the delay if it's not a success message
            delayTimeMS = 5000;
        }
    }

    // check for persistent display
    if(delayTimeMS === 0 || 3 <= this.severity)
    {
        // keep slid down/enable persistent display until user clicks the error modal
        // NOTE: ( we always enable persistent display with CRIT errors )
        errorModal.slideDown();
        errorModal.css('cursor', 'pointer');
        errorModal.click(function(){
            $(this).slideUp();
        });

        return;
    }

    // display the error modal to user
    // check if delay is already
    // DEV NOTE: we slideUp() first in order to make sure the user is reengaged if they generate another msg while
    //  another is already being displayed.
    errorModal.slideUp().slideDown().delay(delayTimeMS).slideUp();

    // if the user hovers over the error modal, stay down until they untarget the error modal
    errorModal.hover(function() {
        $(this).stop(true, true);
    }, function(){
        $(this).delay(delayTimeMS).slideUp();
    });
};

ErrorBot.prototype.logErrorToConsole = function () {
    // logs detailed error message to js console
    console.error('[ ' + errorSeverities[this.severity] + ' ] ' + this.msg);
};

ErrorBot.generateError = function (severity, msg, silent, errorDisplayDelayTime) {
    // abstract function for setting an error, displaying it, and writing a log to the console
    // TODO: make this function non-static so that we aren't declaring this class inside itself
    var eb = new ErrorBot(severity, msg);

    if(0 <= severity)
    {
        // only log errors to the console
        eb.logErrorToConsole();
    }

    if(typeof silent === 'undefined')
    {
        // set to default
        silent = false;
    }
    if(!silent)
    {
        eb.displayMsg(errorDisplayDelayTime);
    }
};