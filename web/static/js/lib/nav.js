/*
    Inquisition // Celestial // Nav.css

    - lib for navigation menu related functionality
 */

var Nav = function () {};

Nav.prepNavMenu = function () {
    /*
        Setup all needed functionality for navigation menu
     */

    // nav menu extension
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

    // loading trigger for nav options
    $('.navOption').click(function () {
        var contentKey = $(this).parent().attr('class');
        Controller.initContent(false, $('#contentWrapper'), contentKey);
    });
};