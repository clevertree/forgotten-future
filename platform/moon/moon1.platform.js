"use strict";
/**
 * Created by ari on 5/14/2017.
 */

// Set up script-side listeners

(function() {
    var Util = ForgottenFuture.Util,
        Platform = ForgottenFuture.Platform,
        Render = ForgottenFuture.Render,
        Input = ForgottenFuture.Input;

    // Extends PlatformPrototype
    Util.loadScript('platform/platform.prototype.js', function() {
        MoonPlatform1.prototype = Object.create(Platform.PlatformPrototype.prototype, {});
        MoonPlatform1.prototype.constructor = MoonPlatform1;
    });

    // Dependencies
    Util.loadScript([
        // Platform Shaders
        // 'render/shader/tilemap.shader.js',
        'render/shader/heightmap.shader.js',
        'render/shader/gridmap2d.shader.js',
        'render/generator/render.generator.js',
    ]);

    var iMoonHeightPattern = Util.loadImage('platform/moon/textures/moon.heighttexture.png');
    var iMoonHeightNormal = Util.loadImage('platform/moon/textures/moon.normalmap.png');

    Platform.MoonPlatform1 = MoonPlatform1;

    /**
     * @param {WebGLRenderingContext} gl
     * @constructor
     * @augments {PlatformPrototype}
     */
    function MoonPlatform1(gl) {
        // Constructor
        Platform.PlatformPrototype.call(this);

        // Level Sprites
        var mapGen = new ForgottenFuture.Render.Generator();

        var gridData = mapGen.genSinWaveGridMap2D();
        var gmMain = new ForgottenFuture.Render.Shader.GridMap2D(gl, gridData)
            .setHeightPatternTexture(gl, iMoonHeightPattern)
            .setHeightNormalTexture(gl, iMoonHeightNormal);

        var heightData = mapGen.genSinWaveHeightMap();
        var hmMain = new ForgottenFuture.Render.Shader.HeightMap(gl, heightData)
            .setHeightPatternTexture(gl, iMoonHeightPattern)
            .setHeightNormalTexture(gl, iMoonHeightNormal);
//             .setHeightMap(iHMapMain, 0.2, 10)
//             .setColor();

        this.renders = [
            gmMain,
            // hmMain,
        ];

        this.hitBoxes = [
            //pfMain,
            gmMain,
            // hmMain,
        ];

    }



})();