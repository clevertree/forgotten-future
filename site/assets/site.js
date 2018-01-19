"use strict";

var site = (function() {
    function Site() {
    }

    Site.prototype.getUrlParams = function() {

        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        var urlParams = {};
        while (match = search.exec(query))
            urlParams[decode(match[1])] = decode(match[2]);
        return urlParams;
    };

    Site.prototype.onEvent = function(className, eventName, callback, options) {
        var elements = document.getElementsByClassName(className);
        for(var i=0; i<elements.length; i++)
            elements[i].addEventListener(eventName, callback, options)
    };

    Site.prototype.includeScript = function(scriptPath, callback) {
        var scriptElm = document.createElement('script');
        scriptElm.src = scriptPath;
        scriptElm.onload = callback;
        document.head.appendChild(scriptElm);
    };

    return new Site;
})();

document.addEventListener("DOMContentLoaded", function() {

    // Event Listeners
    site.onEvent('toggle-page-menu', 'click', togglePageMenu);

    // Functions
    function togglePageMenu(e) {
        document.body.classList.toggle('menu');
    }

});
