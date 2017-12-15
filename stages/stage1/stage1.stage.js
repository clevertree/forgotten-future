/**
 * Created by ari on 5/14/2017.
 */

// Set up client-side listeners

(function() {
    var STAGE_NAME = "Stage1";

    var CHAR_TILDE = 192, CHAR_TAB = 9;

    var DIR_LEVEL_MAP = 'stages/stage1/map/default.tilemap.png';
    var DIR_TILE_SHEET = 'stages/stage1/tiles/default.tiles.png';
    var DIR_HEIGHT_MAP = 'stages/stage1/map/main.heightmap.png';

    var PATH_TILE_DEFAULT = 'stages/stage1/tiles/default.tiles.png';
    var PATH_MAP_BKLAYER = 'stages/stage1/map/bklayer.map.png';

    var Util = ForgottenFuture.Util, Flags = ForgottenFuture.Flags;

    // Level Maps
    Util.loadScript('sprite/fragment/tilemap.fragment.js');
    Util.loadScript('sprite/fragment/heightmap.fragment.js');

    // Sprites
    Util.loadScript('sprite/player1.sprite.js');
    Util.loadScript('sprite/vehicle/RAV/RAV.sprite.js');

    // Load and Render

    function Stage1(e) {
        var THIS = this;
        var Util = Util;

        var canvas = e.target;

        var gl = canvas.getContext('webgl');
        window.addEventListener('resize', handleResize);
        handleResize();

        // Flags
        var stageFlags = Flags.MODE_DEFAULT;

        // Players
        var player1 = new Config.Sprite.Character.Player1(gl, this);
        var RAV1 = new Config.Sprite.Vehicle.RAV(gl, this);
        RAV1.sprite.setScale(5, 2);
        RAV1.sprite.setRotate(0, 0, 1);
        RAV1.sprite.setPosition(7, 8, 0);

        player1.move([0, 10, 0]);

        // Level Sprites
        var pfMain = new ForgottenFuture.Sprite.Fragment.TileMap(gl, this, DIR_LEVEL_MAP, DIR_TILE_SHEET, 64);
        var hmMain = new ForgottenFuture.Sprite.Fragment.HeightMap(gl, this, 9192, DIR_HEIGHT_MAP);

        var renders = [
            hmMain, player1, RAV1, pfMain
        ];
        var hitBoxes = [
            pfMain, hmMain
        ];

        var selectedRender = -1; // renders.length - 1;

        // Default FOV
        this.mProjection = [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, -3, -4, -3, 0, 10];
        this.mGravity = [0, -0.001, 0];

        // Set up render loop
        var lastKeyCount = 0, frameCount = 0;
        function onFrame(t) {
            frameCount++;
            window.requestAnimationFrame(onFrame);

            RAV1.sprite.setRotate(0, 0, frameCount/100);
            // THIS.mProjection[3]-=0.3;
            // this.mProjection = Util.projection(frameCount, frameCount, frameCount); // [2.4142136573791504, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0, 0, -0.20020020008087158, 0];



            // Clear background
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.clearColor(0.03, 0.1, 0.03, 0.1);
            gl.clearDepth(1.0);

            // Enable blending
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);

            // Enable Depth testing
            // gl.enable(gl.DEPTH_TEST); // Depth test creates those ugly opaque textures
            // gl.depthFunc(gl.LESS);

            // Input

            handleKeyChange();

            // Render
            for(var i=0; i<renders.length; i++) {
                var flags = stageFlags;
                if(selectedRender === i)    flags |= Flags.RENDER_SELECTED;
                renders[i].update(t, flags);
                renders[i].render(t, gl, flags);
            }
        }

        var CHAR_SHIFT = 16;
        var keyTildeCount = 0, keyTabCount = 0;
        function handleKeyChange() {
            if(lastKeyCount < Input.keyEvents) {
                lastKeyCount = Input.keyEvents;
                if(keyTildeCount < Input.keyCount[CHAR_TILDE]) {
                    keyTildeCount = Input.keyCount[CHAR_TILDE];
                    if(stageFlags & Flags.MODE_EDITOR) {
                        stageFlags &= ~Flags.MODE_EDITOR;
                        stageFlags |= Flags.MODE_CONSOLE;
                        console.log("Stage Mode changed to: Console");

                    } else if(stageFlags & Flags.MODE_CONSOLE) {
                        stageFlags &= ~Flags.MODE_CONSOLE;
                        stageFlags |= Flags.MODE_DEFAULT;
                        console.log("Stage Mode changed to: Default");

                    } else {
                        stageFlags &= ~Flags.MODE_DEFAULT;
                        stageFlags |= Flags.MODE_EDITOR;
                        console.log("Stage Mode changed to: Editor");
                    }
                }

                if(keyTabCount < Input.keyCount[CHAR_TAB]) {
                    keyTabCount = Input.keyCount[CHAR_TAB];
                    selectedRender++;
                    if(selectedRender >= renders.length)
                        selectedRender = -1;
                    if(selectedRender === -1)
                        console.log("Selected: ", THIS);
                    else
                        console.log("Selected:", renders[selectedRender]);

                }
            }

            if(selectedRender === -1) {
                var V = 0.1;
                var pressedKeys = Input.pressedKeys;
                if(pressedKeys[CHAR_SHIFT]) {
                    V/=10;
                    if(pressedKeys[39])     rotate(-V,  0,  0);  // Right:
                    if(pressedKeys[37])     rotate( V,  0,  0);  // Left:
                    if(pressedKeys[40])     rotate( 0,  V,  0);  // Down:
                    if(pressedKeys[38])     rotate( 0, -V,  0);  // Up:
                    if(pressedKeys[34])     rotate( 0,  0,  V);  // Page Down:
                    if(pressedKeys[33])     rotate( 0,  0, -V);  // Page Up:
                } else {
                    if(pressedKeys[39])     move(-V,  0,  0);  // Right:
                    if(pressedKeys[37])     move( V,  0,  0);  // Left:
                    if(pressedKeys[40])     move( 0,  V,  0);  // Down:
                    if(pressedKeys[38])     move( 0, -V,  0);  // Up:
                    if(pressedKeys[34])     move( 0,  0,  V);  // Page Down:
                    if(pressedKeys[33])     move( 0,  0, -V);  // Page Up:
                }

            }
        }

        function move(tx, ty, tz) {
            THIS.mProjection = Util.translate(THIS.mProjection, tx, ty, tz)
        }
        function rotate(ax, ay, az) {
            if(ax) THIS.mProjection = Util.xRotate(THIS.mProjection, ax);
            if(ay) THIS.mProjection = Util.yRotate(THIS.mProjection, ay);
            if(az) THIS.mProjection = Util.zRotate(THIS.mProjection, az);
        }


        function handleResize() {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
            // console.log("Canvas Resized: ", canvas);
        }

        this.testHit = function (x, y, z) {
            for(var i=0; i<hitBoxes.length; i++) {
                var pixel = hitBoxes[i].testHit(x, y, z);
                if(pixel)
                    return pixel;
            }
            return false;
        };

        // Set up Stage Object

        this.move = move;
        this.rotate = rotate;
        this.startRender = function () {
            window.requestAnimationFrame(onFrame);
        };
    }


    // Event Listeners

    document.addEventListener('render:stages', handleRenderStage);

    function handleRenderStage (e) {
        if(!e.detail)
            throw new Error("Invalid Map Path");
        var scriptPath = e.detail;

        var PATH = 'stages/stage1/stage1.stage.js';
        if(scriptPath !== PATH)
            return;     // TODO: disable active maps on canvas

        var canvas = e.target;
        if(canvas.nodeName.toLowerCase() !== 'canvas')
            throw new Error("Invalid canvas element: " + canvas);

        e.preventDefault();

        Util.waitForLoadingScripts(function() {
            var stage = new Stage1(e);
            stage.startRender();
            console.info("Stage '" + STAGE_NAME + "' is rendering");
        });
    }

})();