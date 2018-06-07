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
        Sprite = ForgottenFuture.Sprite;

    // Extends SpritePrototype
    Util.loadScript('render/prototype/sprite.prototype.js', function() {
        Lem.prototype = Object.create(Sprite.SpritePrototype.prototype, {});
        Lem.prototype.constructor = Lem;
    });

    // Dependencies
    Util.loadScript('render/shader/sprite.shader.js');

    // Constants
    var SLOPE_QUOTIENT = 0.04;
    var MAX_VELOCITY = 0.1;
    var BOUNCE_VELOCITY = 0.4;
    var BOUNCE_QUOTIENT = 0.25;

    // Sprite
    var SPRITE_RESOLUTION = 128;
    var DIR_CHARACTER = 'sprites/';
    var DIR_SHEET = DIR_CHARACTER + 'character/lem/lem-default.'+SPRITE_RESOLUTION+'.sprite-sheet.png';

    // Hit Box
    var HIT_BOX = {
        SIDE_FOOT: [0.3, -0.48],
        CENTER_FOOT: [0.0, -0.48]
    };


    Sprite.Character.Lem = Lem;

    /**
     * Create a new shader instance
     * @param {WebGLRenderingContext} gl
     * @param {StagePrototype} stage
     * @param {Object=} options
     * @constructor
     */
    function Lem(gl, stage, options) {
        options = options || {};

        Sprite.SpritePrototype.call(this, gl, stage, options); // call parent constructor

        // Local Variables
        this.velocity       = [0.1, 0, 0];
        this.acceleration   = [Math.random() * 0.001, -0.0001, 0];
        this.stateScript    = Lem.stateScripts.handleFallingMotion;

        // Sprite Sheet
        this.shader = new ForgottenFuture.Render.Shader.SpriteShader(gl, DIR_SHEET);
        this.shader.addTileFrameSequence('run', 0, 0, 16, 8, 2);
        this.shader.setCurrentFrame('run');
        this.shader.setFrameRate(15 + Math.random()*10); // TODO Custom framerate
    }


    // State Scripts

    Lem.stateScripts = {};
    Lem.stateScripts.handleFallingMotion = function(t) {
        // Velocity
        // this.velocity[0] += vAcceleration[0];
        // this.velocity[1] += vAcceleration[1];
        this.velocity[1] += this.platform.stage.gravity[1];

        // Position
        this.position[0] += this.velocity[0];
        this.position[1] += this.velocity[1];

        // Collision
        var heightAdjust = this.platform.hitBox.testHeight([
            this.position[0]+HIT_BOX.SIDE_FOOT[0] * this.direction,
            this.position[1]+HIT_BOX.SIDE_FOOT[1],
            this.position[2]
        ], this.lastIndex);

        if(!(heightAdjust > 0)) {
            // Falling

        } else {
            // Landing
            this.position[1] += heightAdjust;

            // Hitting the ground
            if(this.velocity[1] < -BOUNCE_VELOCITY) {
                console.log("Bounce => y=", this.velocity[1]);
                this.velocity[1] = Math.abs(this.velocity[1]) * BOUNCE_QUOTIENT;

            } else {
                // Landing on the ground
                this.velocity[1] = 0;
                if(!this.acceleration || this.acceleration[0] !== 0) {
                    this.stateScript = Lem.stateScripts.handleWalkingMotion;
//                     console.log("Falling => Walking");

                } else {
                    this.stateScript = Lem.stateScripts.handleStandingMotion;
//                     console.log("Falling => Standing");
                }
//                     console.log("Standing: ", this.position[0], " => ", leftHeight, rightHeight);
            }
        }
        this.updateModelView();
    };

    Lem.stateScripts.handleStandingMotion = function(t, platform, stage) {
        // Test for map height
        var heightAdjust = platform.hitBox.testHeight([
            this.position[0]+HIT_BOX.SIDE_FOOT[0] * this.direction,
            this.position[1]+HIT_BOX.SIDE_FOOT[1],
            this.position[2]
        ], this.lastIndex);

        if(!(heightAdjust > 0)) {
            // Falling
            this.stateScript = Lem.stateScripts.handleFallingMotion;
//             console.log("Standing -> Falling: ", this.position[0], " => ", heightAdjust);
        }
    };

    Lem.stateScripts.handleWalkingMotion = function(t, platform, stage) {
        // Velocity
        if(Math.abs(this.velocity[0]) < MAX_VELOCITY)
            this.velocity[0] += this.acceleration[0];

        // Position
        this.position[0] += this.velocity[0];

        // Test for map height
        var heightAdjust = platform.hitBox.testHeight([
            this.position[0]+HIT_BOX.SIDE_FOOT[0] * this.direction,
            this.position[1]+HIT_BOX.SIDE_FOOT[1],
            this.position[2]
        ], this.lastIndex);

        // TODO: velocity
        if(heightAdjust < -0.05) {
            // Falling
            this.stateScript = Lem.stateScripts.handleFallingMotion;
//             console.log("Walking -> Falling: ", heightAdjust);


        } else {
            // Walking

            // Adjust footing
            this.position[1] += heightAdjust;

            // Adjust Velocity
            if(heightAdjust > 0) {
                var vv = this.velocity[0];
                if(this.direction < 0) {
                    this.velocity[0] += heightAdjust * SLOPE_QUOTIENT;
                    if(this.velocity[0] > 0) this.velocity[0] = 0;
                } else {
                    this.velocity[0] -= heightAdjust * SLOPE_QUOTIENT;
                    if(this.velocity[0] < 0) this.velocity[0] = 0;
                }
                // console.log(vv, '=>', this.velocity[0]);
            }
//                 console.log("Height adjust: ", this.position[1], heightAdjust);
        }
        this.updateModelView();
    };

})();