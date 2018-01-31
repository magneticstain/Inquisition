/*
    Inquisition // Celestial // Main.css

    - main jquery functionality
 */

$(document).ready(function () {
    // configure main loading progress bar to not hide on completion
    Pace.on('done', function () {
        $('#mainLoadingProgressBar').show()
    });

    var mystic = new Mystic();

    // load content based on content key
    mystic.loadContent($('#contentWrapper'), window.location.hash.substr(1));
});