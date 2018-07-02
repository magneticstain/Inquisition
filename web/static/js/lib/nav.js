/*
    Inquisition // Celestial // Nav.css

    - lib for navigation menu related functionality
 */

var Nav = function () {};

Nav.prepNavMenu = function () {
    /*
        Setup all needed functionality for navigation menu
     */

    var navMenu = $('nav'),
        navMenuOrigWidth = navMenu.width();

    // extend and shrink the nav bar as the user hovers over it
    navMenu.mouseenter(function() {
        $(this).animate({
            width: '200'
        });
    }).mouseleave(function() {
        $(this).animate({
            width: navMenuOrigWidth
        });
    });
};