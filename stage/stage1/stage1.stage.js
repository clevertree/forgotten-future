"use strict";
/**
 * Created by ari on 5/14/2017.
 */

// Set up script-side listeners

(function() {
    var Util = ForgottenFuture.Util,
        Constant = ForgottenFuture.Constant,
        Render = ForgottenFuture.Render,
        Input = ForgottenFuture.Input;

    // Stage Data
    Util.loadScript('stage/stage1/data/stage1.stage.data.js');

    ForgottenFuture.Stage.Stage1 = Stage1;

    /**
     * @param {WebGLRenderingContext} gl
     * @constructor
     */
    function Stage1(gl) {
        // Variables
        var renderList = [];
        var hitboxList = [];

        // Stage Gravity
        var mGravity = [0, -0.0004, 0];
        this.getGravity = function () { return mGravity };

        // Default ViewPort
        var viewPort = new ForgottenFuture.Render.ViewPort.SimpleViewPort();
        this.setViewPort = function (newViewPort) {
            viewPort = newViewPort;
        };

        /**
         * Render the stage
         * @param t
         */
        this.render = function(t) {
            // Clear background
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.clearColor(0.03, 0.1, 0.03, 0.1);
            gl.clearDepth(1.0);

            // Enable blending
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);

            // Update Camera
            var mProjection = viewPort.calculateProjection(t);


            // Enable Depth testing
            // gl.enable(gl.DEPTH_TEST); // Depth test creates those ugly opaque textures
            // gl.depthFunc(gl.LESS);

            // Input

            handleKeyChange();

            // Update
            for(var i=0; i<renderList.length; i++)
                renderList[i].update(t, this);

            // Render
            for(i=0; i<renderList.length; i++)
                renderList[i].render(gl, mProjection);
        };


        // TODO: move to editor file

        // Set up render loop
        var lastKeyCount = 0;
        var CHAR_TILDE = 192, CHAR_TAB = 9, CHAR_SHIFT = 16;
        var keyTildeCount = 0, keyTabCount = 0;
        var selectedRender = -1; // renderList.length - 1;
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
                    if(selectedRender >= renderList.length)
                        selectedRender = -1;
                    if(selectedRender === -1) {
                        THIS.setViewPort(new Render.ViewPort.SimpleViewPort());
                        console.log("Selected: ", THIS);
                    } else {
                        THIS.setViewPort(renderList[selectedRender].getViewPort());
                        console.log("Selected:", renderList[selectedRender]);
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
            for(var i=0; i<hitboxList.length; i++) {
                var pixel = hitboxList[i].testHit(x, y, z);
                if(pixel)
                    return pixel;
            }
            return false;
        };

        this.testHeight = function (x, y, z) {
            var finalHeight = -9999;
            for(var i=0; i<hitboxList.length; i++) {
                var height = hitboxList[i].testHeight(x, y, z);
                if(height > finalHeight)
                    finalHeight = height;
            }
            return finalHeight;
        };

        // Initialize Stage Objects
        Stage1.initData(gl, this, function(initRenderList, initHitboxList) {
            renderList = initRenderList;
            hitboxList = initHitboxList;
        });
    }


})();