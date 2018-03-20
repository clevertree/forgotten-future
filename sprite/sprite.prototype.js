"use strict";
/**
 * Created by ari on 5/14/2017.
 */

// Set up script-side listeners

(function() {
    var Util = ForgottenFuture.Util,
        Sprite = ForgottenFuture.Sprite,
        Render = ForgottenFuture.Render,
        Input = ForgottenFuture.Input;


    Sprite.SpritePrototype = SpritePrototype;

    /**
     * Create a new shader instance
     * @param {WebGLRenderingContext} gl
     * @param {StagePrototype} stage
     * @param {Object=} options
     * @constructor
     */
    function SpritePrototype(gl, stage, options) {
        options = options || {};

        /** @type {Array} **/
        this.scale          = options.scale || [1, 1, 0];
        this.position       = options.position || [0, 0, 0];
        this.velocity       = options.velocity || [0.1, 0, 0];
        this.acceleration   = options.acceleration || [Math.random() * 0.001, stage.gravity[1], 0];
        this.rotation       = options.rotation || null;
        this.direction      = options.direction || 1.0;
        /** @type {Function} **/
        this.stateScript    = handleBounceMotion;
        /** @type {ForgottenFuture.Render.Shader.SpriteShader} **/
        this.shader         = null; // Default shader renderer?
    }

    // Update
    SpritePrototype.prototype.update = function(t, platform, stage) {
        this.stateScript(t, platform, stage);
        this.shader.update(t, this);
    };

    // Rendering
    SpritePrototype.prototype.render = function(gl, mProjection) {
        this.shader.render(gl, this.position, this.rotation, this.scale, mProjection);
    };

    // Model View
    SpritePrototype.prototype.setScale = function(scale)                 { this.scale = scale; };
    SpritePrototype.prototype.setRotate = function(rotation)             { this.rotation = rotation; };
    SpritePrototype.prototype.setPosition = function(position)           { this.position = position; };
    SpritePrototype.prototype.setVelocity = function(velocity)           { this.velocity = velocity; };
    SpritePrototype.prototype.setAcceleration = function(acceleration) {
        if(!this.velocity)
            this.setVelocity([0,0,0]);
        this.acceleration = acceleration;
    };

    // View Port
    SpritePrototype.prototype.getViewPort = function() {
        var sprite = this;
        return new Render.ViewPort.SimpleViewPort(
            function(vViewPosition) {
                vViewPosition[0] = -sprite.position[0];
                vViewPosition[1] = -sprite.position[1] + 2;
                if(vViewPosition[2] < 2)
                    vViewPosition[2] += 0.004 * (2 - vViewPosition[2]);
            }
        );
    };

    SpritePrototype.prototype.getViewPort = function() {
        var sprite = this;
        return new Render.ViewPort.SimpleViewPort(
            function(vViewPosition) {
                vViewPosition[0] = -sprite.position[0];
                vViewPosition[1] = -sprite.position[1] + 2;
                if(vViewPosition[2] < 2.5)
                    vViewPosition[2] += 0.002 * (2.5 - vViewPosition[2]);
            }
        );
    };

    SpritePrototype.prototype.testHit = function (hitBox) {
        var pixel = hitBox.testHit(this.position[0], this.position[1], this.position[2]);
        if(pixel)
            return pixel;
        return false;
    };

    /**
     * @returns float
     * @param {PlatformPrototype} platform
     * @param {array} offset
     */
    // SpritePrototype.prototype.testHeight = function (platform, offset) {
    //     return platform.testHeight([
    //         this.position[0]+offset[0],
    //         this.position[1]+offset[1],
    //         this.position[2]+offset[2]
    //     ]);
    // };

    // Physics

    var BOUNCE_QUOTIENT = 0.25;
    function handleBounceMotion(t, platform, stage) {
        // Velocity
        // this.velocity[0] += vAcceleration[0];
        // this.velocity[1] += vAcceleration[1];
        this.velocity[1] += stage.gravity[1];

        // Position
        this.position[0] += this.velocity[0];
        this.position[1] += this.velocity[1];

        // Collision
        var heightAdjust = platform.testHeight(this.position);

        if(!(heightAdjust > 0)) {
            // Falling

        } else {
            // Landing
            this.position[1] += heightAdjust;

            // Hitting the ground
//             console.log("Bounce => y=", this.velocity[1]);
            this.velocity[1] = Math.abs(this.velocity[1]) * BOUNCE_QUOTIENT;
        }
    }


})();