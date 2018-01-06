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

    // Stage Data
    var deps = [
        // Camera/ViewPort
        'render/viewport/simple.viewport.js',

        // Level Maps
        'render/shader/tilemap.shader.js',
        'render/shader/heightmap.shader.js',
        'render/generator/render.generator.js',

        // Sprites
        'sprite/character/lem/lem.sprite.js',
        'sprite/vehicle/RAV/RAV.sprite.js',
    ];
    Util.loadScript(deps);


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

        // Level Sprites
        var mapGen = new ForgottenFuture.Render.Generator();
        // var pfMain = new ForgottenFuture.Render.Shader.TileMap(gl, this, DIR_LEVEL_MAP, DIR_TILE_SHEET, 64);
        // var hmMain = new ForgottenFuture.Render.Shader.HeightMap(gl, this, 2048, DIR_HEIGHT_MAP);
        var aData0 = mapGen.genSinWaveHeightMap();

        var hmMain = new ForgottenFuture.Render.Shader.HeightMap(gl, aData0);
//             .setHeightMap(iHMapMain, 0.2, 10)
//             .setColor();

        this.renders = [
            hmMain, Lem, RAV1 // , pfMain
        ];
        this.hitBoxes = [
            //pfMain,
            hmMain
        ];
        // RAV1.setRotate([0, 0, 1]);
        RAV1.setPosition([7, 8, 0]);

        Lem.setPosition([10, 10, 0]);
        this.setViewPort(Lem .getViewPort());

        // Extras
        var Lems = [];
        for(var li=0;li<20;li++) {
            Lems[li] = new ForgottenFuture.Sprite.Character.Lem(gl, this);
            Lems[li].setPosition([10, 10, 0]);
            // Lems[li].setVelocity([0.1 * Math.random(), 0, 0]);
            this.renders.unshift(Lems[li]);
        }

        console.log(this);
    }



})();