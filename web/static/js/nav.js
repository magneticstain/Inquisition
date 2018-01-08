/*
    Inquisition // Celestial // Nav.css

    - navigation menu related jquery functionality
 */

$(document).ready(function() {
    // nav menu
    var navMenu = $('nav');

    // get original width
    var navMenuOrigWidth = navMenu.width();

    navMenu.mouseenter(function() {
        $(this).animate({
            width: '200'
        });
    }).mouseleave(function() {
        $(this).animate({
            width: navMenuOrigWidth
        });
    });
});