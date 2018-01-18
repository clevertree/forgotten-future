"use strict";

var urlParams = {};
document.addEventListener("DOMContentLoaded", function() {

    // Event Listeners
    eachClass('toggle-page-menu', function(button) { button.addEventListener('click', togglePageMenu)});

    // Functions


    function togglePageMenu(e) {
        document.body.classList.toggle('menu');
    }

    function eachClass(className, callback) {
        var elements = document.getElementsByClassName(className);
        for(var i=0; i<elements.length; i++) 
            callback(elements[i]);
    }
});

// URL Params
(function() {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);
})();
