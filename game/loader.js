/**
 * Created by Ari on 12/30/2016.
 */


module.exports = (function () {
    var DIR = 'game/';
    var includesLoaded = false;

    return new Loader();

    function Loader() {
        this.onLoad = function (e) {
            if(includesLoaded)
                return;
            includesLoaded = true;
            e.target.postMessage("INCLUDE " + DIR + "client/game1.client.js;");
            e.target.postMessage("INCLUDE " + DIR + "client/game1.css;");
        };
        this.getDir = function() { return DIR; }
    }
})();
