"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

// Set up script-side listeners

(function() {
    var Util            = ForgottenFuture.Util,
        Sprite          = ForgottenFuture.Sprite,
        Render          = ForgottenFuture.Render,
        pressedKeys     = ForgottenFuture.Input.pressedKeys;

    var DIR = 'sprite/vehicle/RAV/';
    var DIR_SPRITESHEET = DIR + 'RAV.spritesheet.png';

    // Extends SpritePrototype
    Util.loadScript('sprite/sprite.prototype.js', function() {
        RAV.prototype = Object.create(Sprite.SpritePrototype.prototype, {});
        RAV.prototype.constructor = RAV;
    });

    Util.loadScript('render/shader/sprite.shader.js');

    var HITPOINTS = [
        [-0.5,0.5], [0.5,0.5], [0.5,-0.5], [-0.5,-0.5]
    ];

    Sprite.Vehicle.RAV = RAV;

    /**
     * Create a new sprite instance
     * @param {WebGLRenderingContext} gl
     * @param {ForgottenFuture.Stage.StagePrototype} stage
     * @constructor
     */
    function RAV(gl, stage) {
        Sprite.SpritePrototype.call(this, gl, stage); // call parent constructor

        var vPosition = [0, 0, 0], vScale = [2,1,0],
            vVelocity = null, vAcceleration = null, vRotation = null;

        // Sprite Sheet
        var sprite = new ForgottenFuture.Render.Shader.Sprite(gl, DIR_SPRITESHEET);

        // Rendering
        this.render = function(gl, mProjection, flags) {
            sprite.render(gl, vPosition, vRotation, vScale, mProjection, flags);
        };

        // Update
        this.update = function (t, stage, flags) {
            sprite.update(t, this, stage, flags);

            // Motion
            if(vVelocity) {
                if(vAcceleration) {
                    vVelocity[0] += vAcceleration[0];
                    vVelocity[1] += vAcceleration[1];
                    vVelocity[2] += vAcceleration[2];
                }
                this.move(vVelocity);
            }
        };

        // Model View
        this.move = function(mDistance) {
            vPosition[0] += mDistance[0];
            vPosition[1] += mDistance[1];
            vPosition[2] += mDistance[2];
        };

        this.setScale = function(vNewScale)                 { vScale = vNewScale; };
        this.setRotate = function(vNewRotation)             { vRotation = vNewRotation; };
        this.setPosition = function(vNewPosition)           { vPosition = vNewPosition; };
        this.setVelocity = function(vNewVelocity)           { vVelocity = vNewVelocity; };
        this.setAcceleration = function(vNewAcceleration) {
            if(!vVelocity)
                this.setVelocity([0,0,0]);
            vAcceleration = vNewAcceleration;
        };

        this.getViewPort = function() {
            return new Render.ViewPort.SimpleViewPort(
                function(vViewPosition) {
                    vViewPosition[0] = -vPosition[0];
                    vViewPosition[1] = -vPosition[1] + 2;
                    if(vViewPosition[2] < 2)
                        vViewPosition[2] += 0.004 * (2 - vViewPosition[2]);
                }
            );
        };

        function handleStageCollision(t, stage, flags) {
            // mAcceleration = null;
            // mVelocity = null;

            // if(!mVelocity) mVelocity = [0, 0, 0];
            // mVelocity = [mVelocity[0], Math.abs(mVelocity[1] * 0.98), mVelocity[2]];
        }

    }

})();