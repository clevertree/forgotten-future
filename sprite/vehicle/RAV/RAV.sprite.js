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
        [0,1], [1,1], [1,0], [0,0]
    ];

    ForgottenFuture.Sprite.Vehicle.RAV = RAV;
    function RAV(gl) {

        var vPosition = [0, 0, 0], vScale = [2,1,0],
            vVelocity = null, vAcceleration = null, vRotation = null;

        // Sprite Sheet
        var sprite = new ForgottenFuture.Render.Shader.Sprite(gl, DIR_SPRITESHEET);

        // Rendering
        this.render = function(t, gl, mProjection, flags) {
            // Update
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

            // Render
            sprite.render(t, gl, vPosition, vRotation, vScale, mProjection, flags);
        };


        this.setScale = function(newScaleX, newScaleY) {
            vScale = [newScaleX, newScaleY || (newScaleX * sprite.ratio), 0];
        };

        this.getVelocity = function() { return vVelocity; };
        this.setVelocity = function(vx, vy, vz) {
            vVelocity = [vx, vy, vz];
        };

        this.getAcceleration = function() { return vAcceleration; };
        this.setAcceleration = function(ax, ay, az) {
            if(!vVelocity)
                this.setVelocity(0,0,0);
            vAcceleration = [ax, ay, az];
        };

        this.getPosition = function () { return vPosition; };
        this.setPosition = function(x, y, z) {
            vPosition = [x, y, z];
        };

        this.getRotate = function () { return vRotation; };
        this.setRotate = function(aX, aY, aZ) {
            vRotation = [aX, aY, aZ];
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