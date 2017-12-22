"use strict";
// noinspection JSNonStrictModeUsed
/**
 * Created by Ari on 12/30/2016.
 */

// Set up script-side listeners

(function() {
    var Util = ForgottenFuture.Util,
        Input = ForgottenFuture.Input,
        Render = ForgottenFuture.Render,
        Constant = ForgottenFuture.Constant;
    var SPRITE_RESOLUTION = 128;
    var DIR_CHARACTER = 'sprite/';
        var DIR_SHEET = DIR_CHARACTER + 'character/lem/lem-default.'+SPRITE_RESOLUTION+'.sprite-sheet.png';

    Util.loadScript('render/shader/sprite.shader.js');

    ForgottenFuture.Sprite.Character.Lem = Lem;
    function Lem(gl) {
        var THIS = this;

        // Local Variables
        var vScale = [1, 1, 0];
        var vPosition = [0, 0, 0], vVelocity = null, vAcceleration = null, vRotation = null;
        var mVelocity = [0.1 * Math.random(), 0, 0];
        var mAcceleration = null;
        // var scale = 1;

        // Sprite Sheet
        var sprite = new ForgottenFuture.Render.Shader.Sprite(gl, DIR_SHEET);
        sprite.addTileFrameSequence('run', 0, 0, 16, 8, 2);
        sprite.setCurrentFrame('run');
        sprite.setFrameRate(20);
        // setScale(scale);
        // move(0, 12, 0);

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

            if(flags & Constant.RENDER_SELECTED)
                updateEditor(t, stage, flags);

            updateMotion(t, stage, flags);
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

        this.getViewPort = function() {
            return new Render.ViewPort.SimpleViewPort(
                function(vViewPosition) {
                    vViewPosition[0] = -vPosition[0];
                    vViewPosition[1] = -vPosition[1] + 2;
                    if(vViewPosition[2] < 2.5)
                        vViewPosition[2] += 0.002 * (2.5 - vViewPosition[2]);
                }
            );
        };


        // Physics

        var CHAR_SHIFT = 16;
        function updateMotion(t, stage, flags) {
            var pressedKeys = Input.pressedKeys;

            // Controls
            // if(pressedKeys[39] || pressedKeys[68])  mAcceleration = [speed, 0, 0];  // Right:
            // if(pressedKeys[37] || pressedKeys[65])  mAcceleration = [-speed, 0, 0];  // Left:
            // if(pressedKeys[40] || pressedKeys[83])  mAcceleration = [0, -speed, 0];  // Down:
            // if(pressedKeys[38] || pressedKeys[87])  mAcceleration = [0, speed, 0];  // Up:
            // if(pressedKeys[71])                     mAcceleration = stage.mGravity;  // Up:

            // Acceleration
            if(mAcceleration) {
                if(!mVelocity) mVelocity = [0, 0, 0];
                mVelocity[0] += mAcceleration[0];
                mVelocity[1] += mAcceleration[1];
                mVelocity[2] += mAcceleration[2];
            }

            // Position
            if(mVelocity)
                THIS.move(mVelocity);

            // Collision
            var hitFloor = stage.testHit(vPosition[0], vPosition[1], vPosition[2]);
            if(!hitFloor) {
                // Fall
                if(!mAcceleration) {
                    mAcceleration = stage.getGravity();
                    if(!mVelocity) mVelocity = [0, 0, 0];
                }

            } else {
                // Standing
                if(mVelocity) // Collision
                    handleStageCollision(t, flags);
            }
        }

        function handleStageCollision(t, flags) {
            mAcceleration = null;
            // mVelocity = null;

            if(!mVelocity) mVelocity = [0, 0, 0];
            mVelocity = [mVelocity[0] + (Math.random()-0.5)/10, Math.abs(mVelocity[1] * 0.98), mVelocity[2]];
        }

        // Editor

        function updateEditor(t, stage, flags) {
            var pressedKeys = Input.pressedKeys;
            if(pressedKeys[39])     THIS.move([0.1,  0.0,  0.0]);  // Right:
            if(pressedKeys[37])     THIS.move([-0.1, 0.0,  0.0]);  // Left:
            if(pressedKeys[40])     THIS.move([0.0, -0.1,  0.0]);  // Down:
            if(pressedKeys[38])     THIS.move([0.0,  0.1,  0.0]);  // Up:
            if(pressedKeys[34])     THIS.move([0.0,  0.0, -0.1]);  // Page Down:
            if(pressedKeys[33])     THIS.move([0.0,  0.0,  0.1]);  // Page Up:
                // stage.testHit(mPosition[0], mPosition[1], mPosition[2]);
        }
    }

})();