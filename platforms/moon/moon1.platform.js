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
    Util.loadScript('render/prototype/platform.prototype.js', function() {
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

    var iMoonHeightPattern = Util.loadImage('platforms/moon/textures/moon.heighttexture.png');
    var iMoonHeightNormal = Util.loadImage('platforms/moon/textures/moon.normalmap.png');

    Platform.MoonPlatform1 = MoonPlatform1;

    /**
     * @param {WebGLRenderingContext} gl
     * @param gridData
     * @param {array} options
     * @constructor
     * @augments {PlatformPrototype}
     */
    function MoonPlatform1(gl, gridData, options) {
        options                     = options || {};

        // Constructor
        Platform.PlatformPrototype.call(this, options);

        options.txHeightPattern     = setupTexture(gl, options.txHeightPattern || iMoonHeightPattern);
        options.txHeightNormal      = setupTexture(gl, options.txHeightNormal || iMoonHeightNormal);

        this.hitBox = new ForgottenFuture.Render.Shader.GridMap2D(gl, gridData, options);
    }

    // Templates

    MoonPlatform1.generateSineWave = function(gl, options) {
        options                 = options || {};
        options.mapLength       = options.mapLength || 2048;
        options.sineFreq        = options.sineFreq || Math.random() * 30 + 20;
        options.sineAmp         = options.sineAmp || Math.random() * 1000 + 400;

        // Generate Map
        var gridData = []; // new Float32Array(mapLength);
        for(var ii=0;ii<options.mapLength;ii++) {
            gridData[ii] = [
                ii*0.9 + Math.random() * 0.8,
                Math.abs(Math.sin(ii / options.sineFreq) * (0.9 + Math.random()/20) * options.sineAmp * (ii/10000))
            ];
        }

        // Create Instance
        return new MoonPlatform1(gl, gridData, options);
    };

    // Local Functions

    function setupTexture(gl, image) {
        if(image instanceof WebGLTexture)
            return image;

        if(image.texture)
            return image.texture;

        var texture = gl.createTexture();
        console.log("Setting up Platform Texture: ", image);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        image.texture = texture;
        return texture;
    }
})();