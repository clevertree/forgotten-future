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
     * @param gridData
     * @param iHeightPattern
     * @param iHeightNormal
     * @param {array} options
     * @constructor
     * @augments {PlatformPrototype}
     */
    function MoonPlatform1(gl, gridData, iHeightPattern, iHeightNormal, options) {
        // Constructor
        Platform.PlatformPrototype.call(this, options);

        this.hitBox = this.hitBox || new ForgottenFuture.Render.Shader.GridMap2D(gl, gridData);
        this.hitBox.setHeightPatternTexture(Util.setupTexture(gl, iHeightPattern));
        this.hitBox.setHeightNormalTexture(Util.setupTexture(gl, iHeightNormal));
    }

    // Templates

    MoonPlatform1.generateSineWave = function(gl, options) {
        options.mapLength       = options.mapLength || 2048;
        options.iHeightPattern  = options.iHeightPattern || iMoonHeightPattern;
        options.iHeightNormal   = options.iHeightNormal || iMoonHeightNormal;

        // Generate Map
        var gridData = []; // new Float32Array(mapLength);
        for(var ii=0;ii<options.mapLength;ii++) {
            gridData[ii] = [
                ii*0.9,
                Math.abs(Math.sin(ii / 20) * (0.9 + Math.random()/20) * 1400 * (ii/10000))
            ];
        }

        // Create Instance
        return new MoonPlatform1(
            gl,
            gridData,
            options.iHeightPattern,
            options.iHeightNormal,
            options);
    };

})();