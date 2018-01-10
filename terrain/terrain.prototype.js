"use strict";
/**
 * Created by ari on 5/14/2017.
 */

// Set up script-side listeners

(function() {
    var Util = ForgottenFuture.Util,
        Terrain = ForgottenFuture.Terrain,
        Render = ForgottenFuture.Render,
        Input = ForgottenFuture.Input;


    Terrain.TerrainPrototype = TerrainPrototype;

    /**
     * @constructor
     */
    function TerrainPrototype() {
        // Variables
        this.hitBoxes = [];

    }

    TerrainPrototype.prototype.update = function(t, stage) {
        // Input

        // handleKeyChange();

        // Update
        for(var i=0; i<this.hitBoxes.length; i++)
            this.hitBoxes[i].update(t, stage);
    };

    TerrainPrototype.prototype.render = function(gl, mProjection) {
        // Render
        for(var i=0; i<this.hitBoxes.length; i++)
            this.hitBoxes[i].render(gl, mProjection);
    };

    // TerrainPrototype.prototype.testHit = function (spritePosition) {
    //     for(var i=0; i<this.hitBoxes.length; i++) {
    //         var pixel = this.hitBoxes[i].testHit(spritePosition;
    //         if(pixel)
    //             return pixel;
    //     }
    //     return false;
    // };
 
    TerrainPrototype.prototype.testHeight = function (spritePosition) {
        var finalHeight = -9999;
        for(var i=0; i<this.hitBoxes.length; i++) {
            var height = this.hitBoxes[i].testHeight(spritePosition);
            if(height > finalHeight)
                finalHeight = height;
        }
        return finalHeight;
    };


})();