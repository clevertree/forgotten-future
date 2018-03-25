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
     * Create a new shader instance
     * @param {WebGLRenderingContext} gl
     * @param {ForgottenFuture.Stage.StagePrototype} stage
     * @constructor
     */
    function RAV(gl, stage) {
        Sprite.SpritePrototype.call(this, gl, stage); // call parent constructor

        // Local Variables
        this.velocity       = [0.1, 0, 0];
        this.acceleration   = [Math.random() * 0.001, stage.gravity[1], 0];

        // Sprite Sheet
        this.shader = new ForgottenFuture.Render.Shader.SpriteShader(gl, DIR_SPRITESHEET);

    }


    // Physics Scripts

    RAV.handleRovingMotion = function(t, platform, stage) {
        // Velocity
        this.velocity[0] += this.acceleration[0]
            * (1 - Math.abs(this.velocity[0]) / MAX_VELOCITY);

        // Position
        this.position[0] += this.velocity[0];

        var heights = new Array(HITPOINTS.length);
        for(var i=0; i<HITPOINTS.length; i++) {
            // Test for map height
            heights[i] = platform.testHeight([
                this.position[0]+HITPOINTS[i][0],
                this.position[1]+HITPOINTS[i][1],
                this.position[2]
            ]);
        }


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
    }
})();