/*
    Inquisition // Celestial // Main.css

    - main jquery functionality
 */

$(document).ready(function () {
    // configure main loading progress bar to not hide on completion
    Pace.on('done', function () {
        $('#mainLoadingProgressBar').show()
    });

    // prep page
    Nav.prepNavMenu();
    Controller.initLoadingModal($('#loadingContainer'), 'large');

    // load content based on content key
    Controller.initContent(false, $('#contentWrapper'), Global.getContentKeyFromCleanURL());
});