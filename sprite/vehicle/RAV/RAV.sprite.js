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

        // Sprite Sheet
        this.shader = new ForgottenFuture.Render.Shader.Sprite(gl, DIR_SPRITESHEET);

    }

})();