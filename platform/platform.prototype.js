"use strict";
/**
 * Created by ari on 5/14/2017.
 */

// Set up script-side listeners

(function() {
    var Util = ForgottenFuture.Util,
        Platform = ForgottenFuture.Platform,
        Render = ForgottenFuture.Render,
        Input = ForgottenFuture.Input;

// TODO: [[x, y, slope], [x, y, ridge]]
    Platform.PlatformPrototype = PlatformPrototype;

    /**
     * @constructor
     */
    function PlatformPrototype() {
        // Variables
        this.hitBoxes = [];
        this.renders = [];
    }

    PlatformPrototype.prototype.update = function(t, stage) {
        // Input

        // handleKeyChange();

        // Update
        for(var i=0; i<this.renders.length; i++)
            this.renders[i].update(t, this, stage);
    };

    PlatformPrototype.prototype.render = function(gl, mProjection) {
        // Render
        for(var i=0; i<this.renders.length; i++)
            this.renders[i].render(gl, mProjection);
    };

    // PlatformPrototype.prototype.testHit = function (spritePosition) {
    //     for(var i=0; i<this.hitBoxes.length; i++) {
    //         var pixel = this.hitBoxes[i].testHit(spritePosition;
    //         if(pixel)
    //             return pixel;
    //     }
    //     return false;
    // };
 
    PlatformPrototype.prototype.testHeight = function (spritePosition) {
        var finalHeight = -9999;
        for(var i=0; i<this.hitBoxes.length; i++) {
            var height = this.hitBoxes[i].testHeight(spritePosition);
            if(height > finalHeight)
                finalHeight = height;
        }
        return finalHeight;
    };


})();