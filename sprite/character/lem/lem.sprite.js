"use strict";
// noinspection JSNonStrictModeUsed
/**
 * Created by Ari on 12/30/2016.
 */

// Set up script-side listeners

(function() {
    // Globals
    var Util = ForgottenFuture.Util,
        Input = ForgottenFuture.Input,
        Render = ForgottenFuture.Render,
        Constant = ForgottenFuture.Constant;

    // Dependencies
    Util.loadScript('render/shader/sprite.shader.js');

    // Constants
    var SLOPE_QUOTIENT = 0.01;
    var BOUNCE_VELOCITY = 0.4;
    var BOUNCE_QUOTIENT = 0.25;

    // Sprite
    var SPRITE_RESOLUTION = 128;
    var DIR_CHARACTER = 'sprite/';
    var DIR_SHEET = DIR_CHARACTER + 'character/lem/lem-default.'+SPRITE_RESOLUTION+'.sprite-sheet.png';

    // Hit Box
    var HIT_BOX = {
        SIDE_FOOT: [0.5, -0.48],
        CENTER_FOOT: [0.0, -0.48]
    };


    ForgottenFuture.Sprite.Character.Lem = Lem;
    function Lem(gl, stage) {
        // Local Variables
        var vScale = [1, 1, 0];
        var vPosition       = [0, 0, 0],
            vVelocity       = [0.1, 0, 0],
            vAcceleration   = [Math.random() * 0.0001, stage.getGravity()[1], 0],
            vRotation = null;
        var direction = 1.0;
        var stateScript = handleFallingMotion;

        // Sprite Sheet
        var sprite = new ForgottenFuture.Render.Shader.Sprite(gl, DIR_SHEET);
        sprite.addTileFrameSequence('run', 0, 0, 16, 8, 2);
        sprite.setCurrentFrame('run');
        sprite.setFrameRate(15 + Math.random()*10);

        // Rendering
        this.render = function(gl, mProjection, flags) {
            sprite.render(gl, vPosition, vRotation, vScale, mProjection, flags);
        };

        // Update
        this.update = function (t, stage, flags) {
            stateScript(t, stage, flags);

            sprite.update(t, this, stage, flags);

            // if(flags & Constant.RENDER_SELECTED)
            //     updateEditor(t, stage, flags);

        };

        // Model View
        this.setScale = function(vNewScale)                 { vScale = vNewScale; };
        this.setRotate = function(vNewRotation)             { vRotation = vNewRotation; };
        this.setPosition = function(vNewPosition)           { vPosition = vNewPosition; };
        this.setVelocity = function(vNewVelocity)           { vVelocity = vNewVelocity; };
        this.setAcceleration = function(vNewAcceleration) {
            if(!vVelocity)
                this.setVelocity([0,0,0]);
            vAcceleration = vNewAcceleration;
        };

        // View Port
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

        function handleFallingMotion(t, stage) {
            // Velocity
            // vVelocity[0] += vAcceleration[0];
            // vVelocity[1] += vAcceleration[1];
            vVelocity[1] += stage.getGravity()[1];

            // Position
            vPosition[0] += vVelocity[0];
            vPosition[1] += vVelocity[1];

            // Collision
            var heightAdjust = stage.testHeight(
                vPosition[0]+HIT_BOX.SIDE_FOOT[0] * direction,
                vPosition[1]+HIT_BOX.SIDE_FOOT[1],
                vPosition[2]);

            if(!(heightAdjust > 0)) {
                // Falling

            } else {
                // Landing
                vPosition[1] += heightAdjust;

                // Hitting the ground
                if(vVelocity[1] < -BOUNCE_VELOCITY) {
                    console.log("Bounce => y=", vVelocity[1]);
                    vVelocity[1] = Math.abs(vVelocity[1]) * BOUNCE_QUOTIENT;

                } else {
                    // Landing on the ground
                    vVelocity[1] = 0;
                    if(!vAcceleration || vAcceleration[0] !== 0) {
                        stateScript = handleWalkingMotion;
                        console.log("Falling => Walking");

                    } else {
                        stateScript = handleStandingMotion;
                        console.log("Falling => Standing");
                    }
//                     console.log("Standing: ", vPosition[0], " => ", leftHeight, rightHeight);
                }
            }
        }

        function handleStandingMotion(t, stage) {
            // Test for map height
            var heightAdjust = stage.testHeight(
                vPosition[0]+HIT_BOX.SIDE_FOOT[0] * direction,
                vPosition[1]+HIT_BOX.SIDE_FOOT[1],
                vPosition[2]);

            if(!(heightAdjust > 0)) {
                // Falling
                stateScript = handleFallingMotion;
                console.log("Standing -> Falling: ", vPosition[0], " => ", heightAdjust);
            }
        }

        function handleWalkingMotion(t, stage) {
            // Velocity
            vVelocity[0] += vAcceleration[0];

            // Position
            vPosition[0] += vVelocity[0];

            // Test for map height
            var heightAdjust = stage.testHeight(
                vPosition[0]+HIT_BOX.SIDE_FOOT[0] * direction,
                vPosition[1]+HIT_BOX.SIDE_FOOT[1],
                vPosition[2]);


            if(heightAdjust < -0.25) {
                // Falling
                stateScript = handleFallingMotion;
                console.log("Walking -> Falling: ", heightAdjust);


            } else {
                // Walking

                // Adjust footing
                vPosition[1] += heightAdjust;

                // Adjust Velocity
                if(heightAdjust > 0) {
                    var vv = vVelocity[0];
                    if(direction < 0) {
                        vVelocity[0] += heightAdjust * SLOPE_QUOTIENT;
                        if(vVelocity[0] > 0) vVelocity[0] = 0;
                    } else {
                        vVelocity[0] -= heightAdjust * SLOPE_QUOTIENT;
                        if(vVelocity[0] < 0) vVelocity[0] = 0;
                    }
                    // console.log(vv, '=>', vVelocity[0]);
                }
//                 console.log("Height adjust: ", vPosition[1], heightAdjust);
            }
        }


        // Arrays

        function setV(oldVector, newVector) {
            oldVector[0] = newVector[0];
            oldVector[1] = newVector[1];
            oldVector[2] = newVector[2];
        }
        function addV(oldVector, newVector) {
            oldVector[0] += newVector[0];
            oldVector[1] += newVector[1];
            oldVector[2] += newVector[2];
        }

    }

})();