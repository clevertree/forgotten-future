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
    function PlatformPrototype(options) {
        options             = options || {};
        if(options.position)
            this.setPosition(options.position);

        // Variables
        this.hitBox         = options.hitBox || null;
        this.sprites        = options.sprites || [];
        this.stage          = options.stage || null;
    }

    PlatformPrototype.prototype.update = function(t, stage) {
        // Input

        // handleKeyChange();

        // Update
        for(var i=0; i<this.sprites.length; i++)
            this.sprites[i].update(t, this, stage);

        // this.hitBox.update(t, this, stages);
    };

    PlatformPrototype.prototype.render = function(gl, mProjection) {
        // Render
        for(var i=0; i<this.sprites.length; i++)
            this.sprites[i].render(gl, mProjection);

        this.hitBox.render(gl, this.modelView, mProjection);
    };

    PlatformPrototype.prototype.addSprite = function(sprite) {
        var p = this.sprites.indexOf(sprite);
        if(p >= 0)
            throw new Error("Sprite already associated with platforms");

        // Check for existing platforms assignment
        if(sprite.platform) {
            p = this.sprites.indexOf(this);
            if(p >= 0)
                this.sprites.splice(p, 1);
        }
        sprite.platform = this;
        this.sprites.push(sprite);
    };


    // PlatformPrototype.prototype.testHit = function (spritePosition) {
    //     for(var i=0; i<this.hitBox.length; i++) {
    //         var pixel = this.hitBox[i].testHit(spritePosition;
    //         if(pixel)
    //             return pixel;
    //     }
    //     return false;
    // };

    PlatformPrototype.prototype.setPosition = function(newPosition) {
        this.position = newPosition;
        this.modelView = Util.translate(defaultModelViewMatrix, newPosition[0], newPosition[1], newPosition[2]);
    };
 
    PlatformPrototype.prototype.testHeight = function (spritePosition, lastIndex, indexPos) {

        if(this.position)
            spritePosition = [
                spritePosition[0] - this.position[0],
                spritePosition[1] - this.position[1],
                spritePosition[2] - this.position[2]
            ];

        return this.hitBox.testHeight(spritePosition, lastIndex, indexPos);
    };


    // Views
    var defaultModelViewMatrix = Util.translation(0,0,0); //[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

})();