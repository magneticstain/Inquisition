/*
    Inquisition // Celestial // Main.js

    - main js-related functionality
 */

$(document).ready(function () {
    // configure main loading progress bar to not hide on completion
    Pace.on('done', function () {
        $('#mainLoadingProgressBar').show();
    });

    // prep page
    Nav.prepNavMenu();

    // load content based on content key
    View.initLoadingModal($('#loadingContainer'), 'large');

    var appController = new Controller($('#contentWrapper'), Global.getContentKeyFromCleanURL());
    appController.initContent();
});