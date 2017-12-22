"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

// Set up script-side listeners

(function() {
    var Util            = ForgottenFuture.Util,
        Flag            = ForgottenFuture.Constant,
        Render          = ForgottenFuture.Render,
        pressedKeys     = ForgottenFuture.Input.pressedKeys;

    var DIR = 'sprite/vehicle/RAV/';
    var DIR_SPRITESHEET = DIR + 'RAV.spritesheet.png';

    Util.loadScript('render/shader/sprite.shader.js');

    var HITPOINTS = [
        [-0.5,0.5], [0.5,0.5], [0.5,-0.5], [-0.5,-0.5]
    ];

    ForgottenFuture.Sprite.Vehicle.RAV = RAV;
    function RAV(gl) {

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
            if(vAcceleration) {
                if(!vVelocity) vVelocity = [0, 0, 0];
                vVelocity[0] += vAcceleration[0];
                vVelocity[1] += vAcceleration[1];
                vVelocity[2] += vAcceleration[2];
            }

            if(vVelocity) {
                vPosition[0] += vVelocity[0];
                vPosition[1] += vVelocity[1];
                vPosition[2] += vVelocity[2];
            }
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