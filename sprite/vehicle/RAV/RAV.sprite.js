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
    Util.loadScript('render/prototype/sprite.prototype.js', function() {
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
        this.velocity       = [0.07, 0, 0];
        this.acceleration   = [Math.random() * 0.001, stage.gravity[1], 0];

        // Sprite Sheet
        this.shader = initShader(gl);
    }

    // Shader

    var vertexList = [
        -1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        -0.5, -0.5, 0.0,
        0.5, -0.5, 0.0,
    ];
    var indexList = [
        1, 2, 3,
        2, 3, 4
    ];
    var shader = null;
    function initShader(gl) {
        return shader || (shader = new ForgottenFuture.Render.Shader.PolygonShader(gl, vertexList, indexList, DIR_SPRITESHEET));
    }


    // Physics Scripts
    RAV.stateScripts = {};
    RAV.stateScripts.handleRovingMotion = function(t, platform, stage) {
        // Velocity
        this.velocity[0] += this.acceleration[0];

        // Position
        this.position[0] += this.velocity[0];

        var heights = new Array(HITPOINTS.length);
        var heightAdjust = -1;
        for(var i=0; i<HITPOINTS.length; i++) {
            // Test for map height
            heights[i] = platform.testHeight([
                this.position[0]+HITPOINTS[i][0],
                this.position[1]+HITPOINTS[i][1],
                this.position[2]
            ], this.lastIndex, i);
            if(heights[i] > heightAdjust)
                heightAdjust = heights[i];
        }


        // TODO: velocity
        if(heightAdjust < -0.05) {
            // Falling
            this.stateScript = RAV.stateScripts.handleFallingMotion;
//             console.log("Walking -> Falling: ", heightAdjust);


        } else {
            // Roving

            // Adjust footing
            this.position[1] += heightAdjust;
        }

        this.updateModelView();
    }
})();