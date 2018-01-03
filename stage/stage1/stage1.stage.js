"use strict";
/**
 * Created by ari on 5/14/2017.
 */

// Set up script-side listeners

(function() {
    var STAGE_NAME = "Stage1";

    var CHAR_TILDE = 192, CHAR_TAB = 9;

    var PATH_STAGE = 'stage/stage1';
    var DIR_LEVEL_MAP = PATH_STAGE + '/map/default.tilemap.png';
    var DIR_TILE_SHEET = PATH_STAGE + '/tiles/default.tiles.png';
    var DIR_HEIGHT_MAP = PATH_STAGE + '/map/main.heightmap.png';

    var PATH_TILE_DEFAULT = PATH_STAGE + '/tiles/default.tiles.png';
    var PATH_MAP_BKLAYER = PATH_STAGE + '/map/bklayer.map.png';

    var Util = ForgottenFuture.Util,
        Constant = ForgottenFuture.Constant,
        Render = ForgottenFuture.Render,
        Input = ForgottenFuture.Input;

    // Camera/ViewPort
    Util.loadScript('render/viewport/simple.viewport.js');

    // Level Maps
    Util.loadScript('render/shader/tilemap.shader.js');
    Util.loadScript('render/shader/heightmap.shader.js');
    Util.loadScript('render/shader/heightmap2.shader.js');

    // Sprites
    Util.loadScript('sprite/character/lem/lem.sprite.js');
    Util.loadScript('sprite/vehicle/RAV/RAV.sprite.js');

    // Map Data
    var iHMapMain = Util.loadImage(PATH_STAGE + '/map/main.heightmap.png');

    // Load and Render

    ForgottenFuture.Stage.Stage1 = Stage1;

    /**
     * @param {WebGLRenderingContext} gl
     * @constructor
     */
    function Stage1(gl) {
        var THIS = this;

        // Flag
        var stageFlags = Constant.MODE_DEFAULT;

        // Variable

        // Stage Gravity
        var mGravity = [0, -0.0004, 0];
        this.getGravity = function () { return mGravity };
        this.setGravity = function (mNewGravity) { mGravity = mNewGravity};

        // Players

        var Lem = new ForgottenFuture.Sprite.Character.Lem(gl, this);
        var RAV1 = new ForgottenFuture.Sprite.Vehicle.RAV(gl, this);
        function init() {
            // RAV1.setRotate([0, 0, 1]);
            RAV1.setPosition([7, 8, 0]);

            Lem.setPosition([10, 10, 0]);
            THIS.setViewPort(Lem .getViewPort());

            // Lem.setScale(0.5);
        }

        var aData0 = new Float32Array(2048);
        for(var ii=0;ii<2048;ii++) {
            aData0[ii] = Math.sin(ii / 100) * (0.9 + Math.random()/10) * 100 * (ii/10000);
        }

        // Level Sprites
        // var pfMain = new ForgottenFuture.Render.Shader.TileMap(gl, this, DIR_LEVEL_MAP, DIR_TILE_SHEET, 64);
        var hmMain = new ForgottenFuture.Render.Shader.HeightMap(gl, this, 2048, DIR_HEIGHT_MAP);
        var hmMain2 = new ForgottenFuture.Render.Shader.HeightMap2(gl, aData0);
//             .setHeightMap(iHMapMain, 0.2, 10)
//             .setColor();

        var renders = [
            hmMain, hmMain2, Lem, RAV1 // , pfMain
        ];
        var hitBoxes = [
            //pfMain,
            hmMain
        ];

        var selectedRender = -1; // renders.length - 1;

        // Extras
        var Lems = [];
        for(var li=0;li<20;li++) {
            Lems[li] = new ForgottenFuture.Sprite.Character.Lem(gl, this);
            Lems[li].setPosition([10, 10, 0]);
            // Lems[li].setVelocity([0.1 * Math.random(), 0, 0]);
            renders.unshift(Lems[li]);
        }

        // Default FOV
        var viewPort = new ForgottenFuture.Render.ViewPort.SimpleViewPort();
        this.setViewPort = function (newViewPort) {
            viewPort = newViewPort;
        };
        // viewPort.script.setVelocity(-0.005, 0, -0.001);


        // Set up render loop
        var lastKeyCount = 0, frameCount = 0;
        /**
         * Render the stage
         * @param t
         */
        this.render = function(t) {
            frameCount++;

            // Clear background
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.clearColor(0.03, 0.1, 0.03, 0.1);
            gl.clearDepth(1.0);

            // Enable blending
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);

            // Update Camera
            var mProjection = viewPort.calculateProjection(t);

            RAV1.setRotate([0, 0, frameCount/100]);
            // Lem.setRotate([0, 0, frameCount/100]);

            // Enable Depth testing
            // gl.enable(gl.DEPTH_TEST); // Depth test creates those ugly opaque textures
            // gl.depthFunc(gl.LESS);

            // Input

            handleKeyChange();

            // Update
            for(var i=0; i<renders.length; i++) {
                var flags = stageFlags;
                if(selectedRender === i)    flags |= Constant.RENDER_SELECTED;
                renders[i].update(t, this, flags);
            }

            // Render
            for(i=0; i<renders.length; i++) {
                flags = stageFlags;
                if(selectedRender === i)    flags |= Constant.RENDER_SELECTED;
                renders[i].render(gl, mProjection, flags);
            }
        };


        var CHAR_SHIFT = 16;
        var keyTildeCount = 0, keyTabCount = 0;
        function handleKeyChange() {
            if(lastKeyCount < Input.keyEvents) {
                lastKeyCount = Input.keyEvents;
                if(keyTildeCount < Input.keyCount[CHAR_TILDE]) {
                    keyTildeCount = Input.keyCount[CHAR_TILDE];
                    if(stageFlags & Constant.MODE_EDITOR) {
                        stageFlags &= ~Constant.MODE_EDITOR;
                        stageFlags |= Constant.MODE_CONSOLE;
                        console.log("Stage Mode changed to: Console");

                    } else if(stageFlags & Constant.MODE_CONSOLE) {
                        stageFlags &= ~Constant.MODE_CONSOLE;
                        stageFlags |= Constant.MODE_DEFAULT;
                        console.log("Stage Mode changed to: Default");

                    } else {
                        stageFlags &= ~Constant.MODE_DEFAULT;
                        stageFlags |= Constant.MODE_EDITOR;
                        console.log("Stage Mode changed to: Editor");
                    }
                }

                if(keyTabCount < Input.keyCount[CHAR_TAB]) {
                    keyTabCount = Input.keyCount[CHAR_TAB];
                    selectedRender++;
                    if(selectedRender >= renders.length)
                        selectedRender = -1;
                    if(selectedRender === -1) {
                        THIS.setViewPort(new Render.ViewPort.SimpleViewPort());
                        console.log("Selected: ", THIS);
                    } else {
                        THIS.setViewPort(renders[selectedRender].getViewPort());
                        console.log("Selected:", renders[selectedRender]);
                    }
                }
            }

            if(selectedRender === -1) {
                var V = 0.1;
                var pressedKeys = Input.pressedKeys;
                if(pressedKeys[CHAR_SHIFT]) {
                    V/=10;
                    if(pressedKeys[39])     viewPort.rotate(-V,  0,  0);  // Right:
                    if(pressedKeys[37])     viewPort.rotate( V,  0,  0);  // Left:
                    if(pressedKeys[40])     viewPort.rotate( 0,  V,  0);  // Down:
                    if(pressedKeys[38])     viewPort.rotate( 0, -V,  0);  // Up:
                    if(pressedKeys[34])     viewPort.rotate( 0,  0,  V);  // Page Down:
                    if(pressedKeys[33])     viewPort.rotate( 0,  0, -V);  // Page Up:
                } else {
                    if(pressedKeys[39])     viewPort.move(-V,  0,  0);  // Right:
                    if(pressedKeys[37])     viewPort.move( V,  0,  0);  // Left:
                    if(pressedKeys[40])     viewPort.move( 0,  V,  0);  // Down:
                    if(pressedKeys[38])     viewPort.move( 0, -V,  0);  // Up:
                    if(pressedKeys[34])     viewPort.move( 0,  0,  V);  // Page Down:
                    if(pressedKeys[33])     viewPort.move( 0,  0, -V);  // Page Up:
                }

            }
        }

        this.testHit = function (x, y, z) {
            for(var i=0; i<hitBoxes.length; i++) {
                var pixel = hitBoxes[i].testHit(x, y, z);
                if(pixel)
                    return pixel;
            }
            return false;
        };

        this.testHeight = function (x, y, z) {
            var finalHeight = -9999;
            for(var i=0; i<hitBoxes.length; i++) {
                var height = hitBoxes[i].testHeight(x, y, z);
                if(height > finalHeight)
                    finalHeight = height;
            }
            return finalHeight;
        };

        // Initialize Stage Objects
        init();
    }


})();