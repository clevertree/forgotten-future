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
     * @param {WebGLRenderingContext} gl
     * @constructor
     */
    function SpritePrototype(gl) {

    }
    SpritePrototype.prototype.update = function(t) {
    };

    SpritePrototype.prototype.render = function(gl, t) {
    };


})();