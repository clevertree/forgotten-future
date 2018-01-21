"use strict";

var site = (function() {
    function Site() {
        this.links = [
            ['Game', 'index.html'],
            ['Contribute', 'contribute.html'],
            ['Media', 'media.html'],
            ['FAQ', 'faq.html'],
            ['Cataclysm', 'timeline.html'],
            ['Characters', 'characters.html'],
            ['Locations', 'locations.html'],
            ['Technology', 'technology.html'],
            ['Demo', 'demo.html']
        ]
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

    Site.prototype.generateNavLinks = function(container) {
        var fileName = location.href.split("/").slice(-1)[0];
        for (var i = 0; i < this.links.length; i++) {
            var liElm = document.createElement('li');
            var aElm = document.createElement('a');
            aElm.href = this.links[i][1];
            aElm.innerHTML = this.links[i][0];
            container.appendChild(liElm);
            liElm.appendChild(aElm);

            if(this.links[i][1] === fileName)
                liElm.classList.add('highlight');
        }
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

    // Auto-generate nav bar
    (function() {
        var pageLinks = document.getElementsByClassName('page-links');
        for(var i=0; i<pageLinks.length; i++)
            if(pageLinks[i].classList.contains('autogenerate'))
                site.generateNavLinks(pageLinks[i]);
    })();
});
