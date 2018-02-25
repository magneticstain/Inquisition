/**
 *  Inquisition // Celestial // Errorbot.js
 *
 *  - A JS library for displaying and delivering errors
 *
 *  - SRC: https://github.com/magneticstain/CLTools/blob/master/CLWeb/static/js/errorbot.js
 */

var errorModal = $('#mainErrorModal');

var errorSeverities = [
    'INFO',
    'ERROR',
    'WARN',
    'CRIT',
    'FATAL'
];

var ErrorBot = function(sev, msg){
    this.setError(sev, msg);
};

ErrorBot.prototype.setErrorModalHTML = function () {
    errorModal.html('' +
        '<img src="/static/imgs/icons/error.svg" alt="ERROR - ' + errorSeverities[this.severity] + '">' +
        '<p>' + this.msg + '</p>');
};

ErrorBot.prototype.setError = function (severity, msg) {
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

ErrorBot.prototype.displayError = function (delayTimeMS) {
    // update any loading modules that are running
    $('#loadingContainer').replaceWith('' +
        '<div class="errorContainer">' +
        '   <img src="/static/imgs/robot.svg">' +
        '   <p class="fancyHeading">Uh oh - looks like we encountered an error!</p>' +
        '</div>');

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

    // check if delay time was provided
    if(typeof delayTimeMS === 'undefined')
    {
        // set to default delay time
        delayTimeMS = 5000;
    }

    // display the error modal to user
    errorModal.slideDown().delay(delayTimeMS).slideUp();

    // if the user hovers over the error modal, stay down until they untarget the error modal
    errorModal.hover(function() {
        $(this).stop(true, true);
    }, function(){
        $(this).delay(delayTimeMS).slideUp();
    });
};

ErrorBot.prototype.logErrorToConsole = function () {
    // logs detailed error message to js console
    console.log('[ ' + errorSeverities[this.severity] + ' ] ' + this.msg);
};

ErrorBot.generateError = function (severity, msg, silent, errorDisplayDelayTime) {
    // abstract function for setting an error, displaying it, and writing a log to the console
    var eb = new ErrorBot();

    if(typeof silent === 'undefined')
    {
        // set to default delay time
        silent = false;
    }

    eb.setError(severity, msg);
    eb.logErrorToConsole();
    if (! silent) {
        eb.displayError(errorDisplayDelayTime);
    }
};