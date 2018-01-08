/*
    Inquisition // Celestial // Main.css

    - main jquery functionality
 */

$(document).ready(function() {
    // configure main loading progress bar to not hide on completion
    Pace.on('done', function() {
        $('#mainLoadingProgressBar').show()
    });
});