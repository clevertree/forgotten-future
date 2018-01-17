"use strict";
/**
 * Created by ari on 5/14/2017.
 */

// Set up script-side listeners

(function() {
    var Util = ForgottenFuture.Util,
        Terrain = ForgottenFuture.Terrain,
        Render = ForgottenFuture.Render,
        Input = ForgottenFuture.Input;

    // Extends TerrainPrototype
    Util.loadScript('terrain/terrain.prototype.js', function() {
        MoonTerrain1.prototype = Object.create(Terrain.TerrainPrototype.prototype, {});
        MoonTerrain1.prototype.constructor = MoonTerrain1;
    });

    // Dependencies
    Util.loadScript([
        // Terrain Shaders
        // 'render/shader/tilemap.shader.js',
        'render/shader/heightmap.shader.js',
        'render/generator/render.generator.js',
    ]);

    var iMoonHeightPattern = Util.loadImage('terrain/moon/textures/moon.heighttexture.png');
    var iMoonHeightNormal = Util.loadImage('terrain/moon/textures/moon.normalmap.png');

    Terrain.MoonTerrain1 = MoonTerrain1;

    /**
     * @param {WebGLRenderingContext} gl
     * @constructor
     * @augments {TerrainPrototype}
     */
    function MoonTerrain1(gl) {
        // Constructor
        Terrain.TerrainPrototype.call(this);

        // Level Sprites
        var mapGen = new ForgottenFuture.Render.Generator();
        // var pfMain = new ForgottenFuture.Render.Shader.TileMap(gl, this, DIR_LEVEL_MAP, DIR_TILE_SHEET, 64);
        // var hmMain = new ForgottenFuture.Render.Shader.HeightMap(gl, this, 2048, DIR_HEIGHT_MAP);
        var aData0 = mapGen.genSinWaveHeightMap();

        var hmMain = new ForgottenFuture.Render.Shader.HeightMap(gl, aData0)
            .setHeightPatternTexture(gl, iMoonHeightPattern)
            .setHeightNormalTexture(gl, iMoonHeightNormal);
//             .setHeightMap(iHMapMain, 0.2, 10)
//             .setColor();

        this.hitBoxes = [
            //pfMain,
            hmMain
        ];

    }



})();