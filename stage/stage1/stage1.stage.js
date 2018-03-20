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

        this.viewPort = Lem .getViewPort();

        // Platform
        this.platforms = [
            new ForgottenFuture.Platform.MoonPlatform1(gl)
        ];
        this.platforms[0].renders.push(Lem, RAV1); // , pfMain

        initEditorContent(this, gl);
    }



    function initEditorContent(stage, gl) {
        /** - EDITOR_CONTENT_START **/
        var Lems = [];
        for(var li=0;li<20;li++) {
            Lems[li] = new ForgottenFuture.Sprite.Character.Lem(gl, stage);
            Lems[li].setPosition([10, 10, 0]);
            // Lems[li].setVelocity([0.1 * Math.random(), 0, 0]);
            stage.platforms[0].renders.push(Lems[li]);
        }
        /** - EDITOR_CONTENT_END **/
    }

})();