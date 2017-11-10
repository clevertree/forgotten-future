/**
 * Created by ari on 5/14/2017.
 */

// Set up client-side listeners

(function() {
    var CHAR_TILDE = 192, CHAR_TAB = 9;
    var Config = window.games.game1;
    var ROOT = Config.path.root;
    var DIR_STAGE = ROOT + 'stages/stage1/';
    var DIR_LEVEL_MAP = DIR_STAGE + 'map/default.tilemap.png';
    var DIR_TILE_SHEET = DIR_STAGE + 'tiles/default.tiles.png';
    var DIR_HEIGHT_MAP = DIR_STAGE + 'map/main.heightmap.png';

    var PATH_TILE_DEFAULT = DIR_STAGE + 'tiles/default.tiles.png';
    var PATH_MAP_BKLAYER = DIR_STAGE + 'map/bklayer.map.png';
    var SCRIPT_ASSETS = [
        ROOT + 'fragment/color.fragment.js',
        ROOT + 'fragment/texture.fragment.js',
        ROOT + 'fragment/spritesheet.fragment.js',

        ROOT + 'fragment/tilemap.fragment.js',
        ROOT + 'fragment/tilemap.fragment.editor.js',

        ROOT + 'fragment/heightmap.fragment.js',
        ROOT + 'fragment/heightmap.fragment.editor.js',

        ROOT + 'sprite/player1.sprite.js',
        ROOT + 'sprite/player2.sprite.js',

        // Levels
        // DIR_STAGE + 'level/level1.level.js',
    ];

    // Load and Render

    function Stage1(e) {
        var Config = window.games.game1, THIS = this;
        var Util = Config.util;

        var canvas = e.target;

        var gl = canvas.getContext('webgl');
        window.addEventListener('resize', handleResize);
        handleResize();

        // Flags
        var stageFlags = Config.flags.MODE_DEFAULT;

        // Players
        var player1 = new Config.character.Player1(gl);

        player1.move([0, 10, 0]);

        // Level Sprites
        var pfMain = new Config.fragment.TileMap(gl, DIR_LEVEL_MAP, DIR_TILE_SHEET, 64);
        var hmMain = new Config.fragment.HeightMap(gl, 9192, DIR_HEIGHT_MAP);

        var renders = [
            hmMain, player1, pfMain
        ];
        var hitBoxes = [
            pfMain, hmMain
        ];

        var selectedRender = 0; // renders.length - 1;

        // Default FOV
        this.mProjection = [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, -3, -4, -3, 0, 10];
        this.mGravity = [0, -0.001, 0];

        // Set up render loop
        var lastKeyCount = 0, frameCount = 0;
        function onFrame(t) {
            frameCount++;
            window.requestAnimationFrame(onFrame);

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
                if(selectedRender === i)    flags |= Config.flags.RENDER_SELECTED;
                renders[i].update(t, THIS, flags);
                renders[i].render(t, gl, THIS, flags);
            }
        }

        var CHAR_SHIFT = 16;
        var keyTildeCount = 0, keyTabCount = 0;
        function handleKeyChange() {
            if(lastKeyCount < Config.input.keyEvents) {
                lastKeyCount = Config.input.keyEvents;
                if(keyTildeCount < Config.input.keyCount[CHAR_TILDE]) {
                    keyTildeCount = Config.input.keyCount[CHAR_TILDE];
                    if(stageFlags & Config.flags.MODE_EDITOR) {
                        stageFlags &= ~Config.flags.MODE_EDITOR;
                        stageFlags |= Config.flags.MODE_CONSOLE;
                        console.log("Stage Mode changed to: Console");

                    } else if(stageFlags & Config.flags.MODE_CONSOLE) {
                        stageFlags &= ~Config.flags.MODE_CONSOLE;
                        stageFlags |= Config.flags.MODE_DEFAULT;
                        console.log("Stage Mode changed to: Default");

                    } else {
                        stageFlags &= ~Config.flags.MODE_DEFAULT;
                        stageFlags |= Config.flags.MODE_EDITOR;
                        console.log("Stage Mode changed to: Editor");
                    }
                }

                if(keyTabCount < Config.input.keyCount[CHAR_TAB]) {
                    keyTabCount = Config.input.keyCount[CHAR_TAB];
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
                var pressedKeys = Config.input.pressedKeys;
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

        var PATH = DIR_STAGE + 'stage1.stage.js';
        if(scriptPath !== PATH)
            return;     // TODO: disable active maps on canvas

        var canvas = e.target;
        if(canvas.nodeName.toLowerCase() !== 'canvas')
            throw new Error("Invalid canvas element: " + canvas);

        e.preventDefault();

        var CONFIG = window.games.game1;
        CONFIG.util.loadScripts(SCRIPT_ASSETS, function() {
            var stage = new Stage1(e);
            stage.startRender();
        });
    }

})();