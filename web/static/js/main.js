/*
    Inquisition // Celestial // Main.js

    - main js-related functionality
 */

$(document).ready(function () {
    // configure main loading progress bar to not hide on completion
    Pace.on('done', function () {
        $('#mainLoadingProgressBar').show()
    });

    // prep page
    Nav.prepNavMenu();

    // load content based on content key
    Controller.initLoadingModal($('#loadingContainer'), 'large');
    Controller.initContent(false, $('#contentWrapper'), Global.getContentKeyFromCleanURL());
});