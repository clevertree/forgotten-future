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
        this.hitBox = null;
        this.sprites = [];
    }

    PlatformPrototype.prototype.update = function(t, stage) {
        // Input

        // handleKeyChange();

        // Update
        for(var i=0; i<this.sprites.length; i++)
            this.sprites[i].update(t, this, stage);
    };

    PlatformPrototype.prototype.render = function(gl, mProjection) {
        // Render
        for(var i=0; i<this.sprites.length; i++)
            this.sprites[i].render(gl, mProjection);
    };

    // PlatformPrototype.prototype.testHit = function (spritePosition) {
    //     for(var i=0; i<this.hitBox.length; i++) {
    //         var pixel = this.hitBox[i].testHit(spritePosition;
    //         if(pixel)
    //             return pixel;
    //     }
    //     return false;
    // };
 
    PlatformPrototype.prototype.testHeight = function (spritePosition, lastIndex) {
        return this.hitBox.testHeight(spritePosition, lastIndex);
    };


})();