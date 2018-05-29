"use strict";
/**
 * Created by ari on 5/14/2017.
 */

// Set up script-side listeners

(function() {
    var Util = ForgottenFuture.Util,
        Stage = ForgottenFuture.Stage,
        Render = ForgottenFuture.Render,
        Input = ForgottenFuture.Input;

    // Extends StagePrototype
    Util.loadScript('render/prototype/stage.prototype.js', function() {
        Stage1.prototype = Object.create(Stage.StagePrototype.prototype, {});
        Stage1.prototype.constructor = Stage1;
    });

    // Dependencies
    Util.loadScript([
        // Camera/ViewPort
        'render/viewport/simple.viewport.js',

        // Platform Maps
        'platforms/moon/moon1.platform.js',

        // Sprites
        'sprites/character/lem/lem.sprite.js',
        'sprites/vehicle/RAV/RAV.sprite.js'
    ]);


    Stage.Stage1 = Stage1;

    /**
     * @param {WebGLRenderingContext} gl
     * @constructor
     * @augments {StagePrototype}
     */
    function Stage1(gl) {
        // Constructor
        Stage.StagePrototype.call(this);

        // Players
        var RAV1 = new ForgottenFuture.Sprite.Vehicle.RAV(gl, this);
        // RAV1.setRotate([0, 0, 1]);
        RAV1.position = [7, 8, 0];


        initEditorContent(this, gl);
        // this.viewPort = this.platforms[19].sprites[0].getViewPort(); // this.platforms[Math.floor(Math.random()*20)].sprites[0].getViewPort();
        this.setSpriteViewPort(RAV1); // this.platforms[Math.floor(Math.random()*20)].sprites[0].getViewPort();
        this.platforms[19].addSprite(RAV1);
    }



    function initEditorContent(stage, gl) {
        /** - EDITOR_CONTENT_START **/
        for(var i=20;i>0;i--) {
            var options = {
                position: [0, 0, -i]
            };
            var Platform = ForgottenFuture.Platform.MoonPlatform1.generateSineWave(gl, options);
            stage.addPlatform(Platform);

            for (var j = 0; j < 15; j++) {
                var Lem = new ForgottenFuture.Sprite.Character.Lem(gl, stage);
                Lem.setPosition([10 + i, 10, -i]);
                // Lem.setVelocity([0.1 * Math.random(), 0, 0]);
//                 Platform.sprites.push(Lem);
                Lem.setPlatform(Platform);
            }
        }
        /** - EDITOR_CONTENT_END **/
    }

})();