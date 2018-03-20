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
    Util.loadScript('stage/stage.prototype.js', function() {
        Stage1.prototype = Object.create(Stage.StagePrototype.prototype, {});
        Stage1.prototype.constructor = Stage1;
    });

    // Dependencies
    Util.loadScript([
        // Camera/ViewPort
        'render/viewport/simple.viewport.js',

        // Platform Maps
        'platform/moon/moon1.platform.js',

        // Sprites
        'sprite/character/lem/lem.sprite.js',
        'sprite/vehicle/RAV/RAV.sprite.js'
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
        var Lem = new ForgottenFuture.Sprite.Character.Lem(gl, this);
        var RAV1 = new ForgottenFuture.Sprite.Vehicle.RAV(gl, this);
        // RAV1.setRotate([0, 0, 1]);
        RAV1.setPosition([7, 8, 0]);

        Lem.setPosition([10, 10, 0]);

        this.viewPort = Lem.getViewPort();

        initEditorContent(this, gl);
        this.platforms[19].renders.push(Lem, RAV1); // , pfMain

    }



    function initEditorContent(stage, gl) {
        /** - EDITOR_CONTENT_START **/
        for(var i=20;i>0;i--) {
            var options = {
                position: [0, 0, -i]
            };
            var Platform = new ForgottenFuture.Platform.MoonPlatform1(gl, options);
            stage.platforms.push(Platform);

            for (var j = 0; j < 55; j++) {
                var Lem = new ForgottenFuture.Sprite.Character.Lem(gl, stage);
                Lem.setPosition([10 + i, 10, -i]);
                // Lem.setVelocity([0.1 * Math.random(), 0, 0]);
                Platform.renders.push(Lem);
            }
        }
        /** - EDITOR_CONTENT_END **/
    }

})();