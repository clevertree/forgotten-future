"use strict";
/**
 * Created by Ari on 3/23/2018.
 */

(function() {

    var instance = new Stats();
    ForgottenFuture.Stats = instance;

    // Stats


    function Stats() {
        this.perSec = 0;
        this.count = 0;
        // this.tCount = 0;
    }

    var start = Date.now();
    Stats.prototype.render = function() {
        var t = (Date.now() - start) / 1000;
        this.perSec = Math.round(this.count / t);
        console.log(this);
    };

    setInterval(function() {
        instance.render();
    }, 5000);
    // instance.render();
})();