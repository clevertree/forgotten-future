/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    if(typeof window['games'] === 'undefined')
        window.games = {};
    if(typeof window['games']['game1'] !== 'undefined')
        throw new Error("game1 already included");

    var ROOT = 'game/';
    var Config = {}, Util = {};
    var pressedKeys = {}, keyCount = {};
    Config.fragment = {editor:{}};
    Config.character = {};
    Config.level = {};
    Config.input = { pressedKeys:pressedKeys, keyCount: keyCount, keyEvents: 0, lastKey: null, keyConstants: {
        CHAR_SHIFT: 16, CHAR_CTRL: 17, CHAR_ALT: 18
    } };
    Config.util = Util;
    Config.path = {
        root: ROOT,
        stage_default: ROOT + 'stages/stage1/stage1.stage.js'
    };
    Config.flags = {
        MODE_DEFAULT: 0x00,
        MODE_EDITOR: 0x01,
        MODE_CONSOLE: 0x02,

        RENDER_SELECTED: 0x10
    };
    Config.constants = {
        PIXELS_PER_UNIT: 256
    };
    window.games.game1 = Config;

    // Event Handlers

    document.addEventListener('response:play', handlePlayResponse);
    document.addEventListener('keydown', handleKeyDown); // TODO: too strong?
    document.addEventListener('keyup', handleKeyUp);

    window.addEventListener('resize', handleWindowResize);

    // Canvas Loading

    // function handleWindowResize (e) {
    //     console.log('resize ', e);
    //
    //     // Set viewport size (Todo: optimize)
    //     if(canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    //         canvas.width = canvas.clientWidth;
    //         canvas.height = canvas.clientHeight;
    //         gl.viewport(0, 0, canvas.width, canvas.height);
    //         console.log("Resizing: ", canvas.width, canvas.height);
    //     }
    // }

    function handlePlayResponse (e) {
        // var commandString = e.data || e.detail;
        e.preventDefault();
        if(document.readyState === 'complete') {
            setTimeout(play, 100);

        } else {
            document.addEventListener("DOMContentLoaded", play);
        }
    }

    function handleKeyDown(e) {
        if(e.keyCode === 9)
            e.preventDefault();
        if(pressedKeys[e.keyCode] !== true) {
            pressedKeys[e.keyCode] = true;
            keyCount[e.keyCode] = (keyCount[e.keyCode] || 0) + 1;
            Config.input.keyEvents++;
            Config.input.lastKey = e.keyCode;
        }
    }
    function handleKeyUp(e) {
        pressedKeys[e.keyCode] = false;
        // Config.input.keyEvents++;
        // e.preventDefault();
    }

    function play(stagePath) {
        stagePath = stagePath || Config.path.stage_default;
        // console.info("Loading game1...");
        // Find game canvas(es)
        var canvasList = document.getElementsByClassName('play:canvas');

        if(canvasList.length === 0) {
            var newCanvas = document.createElement('canvas');
            newCanvas.setAttribute('id', 'play:canvas');
            newCanvas.setAttribute('class', 'play:canvas game1-default-canvas fullscreen');
            // newCanvas.setAttribute('width', 600);
            // newCanvas.setAttribute('height', 300);
            document.body.appendChild(newCanvas);
            canvasList = document.getElementsByClassName('play:canvas');
        }

        Util.loadScript(stagePath, function() {
            var event = new CustomEvent('render:stages', {
                'detail': stagePath,
                'cancelable': true,
                'bubbles': true
            });

            for(var i=0; i<canvasList.length; i++) {
                var canvas = canvasList[i];

                canvas.addEventListener('click', handleClickEvent);

                canvas.dispatchEvent(event);
            }
            if (!event.defaultPrevented)
                throw new Error("Render event was not handled");
        });
    }

    function handleWindowResize(e) {
        var canvasList = document.getElementsByClassName('play:canvas');

        for(var i=0; i<canvasList.length; i++) {
            var canvas = canvasList[i];
            if(canvas.classList.contains('play:canvas')) {
                if(canvas.classList.contains('fullscreen')) {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    console.log("Resized: ", canvas, canvas.width, canvas.height);
                }
            }
        }
    }

    function handleClickEvent(e) {
        if(e.target.nodeName.toLowerCase() !== 'canvas')
            return;
        var canvas = e.target;
        if(!canvas.classList.contains("play:canvas"))
            return;
            // elemLeft = canvas.offsetLeft,
            // elemTop = canvas.offsetTop;
        var x = event.pageX - canvas.offsetLeft,
            y = event.pageY - canvas.offsetTop;
        console.log("Click:", x, y);
    }

    // Util

    Util.compileProgram = function(gl, vertexShaderSource, fragmentShaderSource) {

        // Create the shader object
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        // Check if it compiled
        var success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
        if (!success)
            throw "could not compile shader:" + gl.getShaderInfoLog(vertexShader);

        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        // Check if it compiled
        success = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
        if (!success)
            throw "could not compile shader:" + gl.getShaderInfoLog(fragmentShader) + fragmentShaderSource;


        // create a program.
        var program = gl.createProgram();

        // attach the shaders.
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // link the program.
        gl.linkProgram(program);

        // Check if it linked.
        success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success)
            throw ("program filed to link:" + gl.getProgramInfoLog(program));


        // Load all attributes and uniforms from the compiled shaders
        program.attribute = {};
        program.uniform = {};

        var count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (var i = 0; i < count; i++) {
            var attrib = gl.getActiveAttrib(program, i);
            program.attribute[attrib.name] = gl.getAttribLocation(program, attrib.name);
        }

        count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (i = 0; i < count; i++) {
            var uniform = gl.getActiveUniform(program, i);
            var name = uniform.name.replace("[0]", "");
            program.uniform[name] = gl.getUniformLocation(program, name);
        }

        return program;
    };

    // Script Loading

    Util.loadScript = function(scriptPath, callback) {
        var scriptPathEsc = scriptPath.replace(/[/.]/g, '\\$&');
        var foundScript = document.head.querySelectorAll('script[src=' + scriptPathEsc + ']');
        if (foundScript.length === 0) {
//             console.log("Including Script " + scriptPath);
            var scriptElm = document.createElement('script');
            scriptElm.src = scriptPath;
            scriptElm.onload = callback;
            document.head.appendChild(scriptElm);

        } else {
            if(callback) callback();
        }
    };

    Util.loadScripts = function(scriptPathList, callback) {
        var counter = 0;
        for(var i=0; i<scriptPathList.length; i++) {
            counter++;
            Util.loadScript(scriptPathList[i], scriptLoaded);
        }
        if(counter === 0)
            callback();

        function scriptLoaded() {
            counter--;
            if(counter === 0 && callback)
                callback();
        }
    };

    Util.loadTexture = function(gl, filePath, callback, loadFill) {
        loadFill = loadFill || [0, 0, 255, 128];

        // Create a texture.
        var texture = gl.createTexture();
        texture.loaded = false;
        texture.onLoad = callback || function(e, texture, image) {};
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array(loadFill));

        // Asynchronously load an image
        var image = new Image();
        image.src = filePath;
        image.addEventListener('load', function(e) {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            // gl.generateMipmap(gl.TEXTURE_2D);

            texture.loaded = true;
            // Callback
            texture.onLoad(e, texture, image);
        });
        texture.image = image;
        return texture;
    };

    // Editor Utils

    Util.assetSavePNG = function(path, data, left, top, width, height) {
        var POST = {
            "action": "asset-save-png",
            "path": path,
            "data": data,
            "left": left,
            "top": top,
            "width": width,
            "height": height
        };
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4) {
                if(this.status !== 200)
                    throw new Error(this.responseText);
                var json = JSON.parse(this.responseText);
                console.log(json);
            }
        };
        xhttp.open("POST", ROOT + '/client/game1.interface.php', true);
        xhttp.setRequestHeader('Content-type', 'application/json');
        xhttp.send(JSON.stringify(POST));
    };

    // Matrix Utils

    Util.projection = function(width, height, depth) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, 2 / depth, 0,
            -1, 1, 0, 1
        ];
    };

    Util.multiply = function(a, b) {
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
        ];
    };

    Util.translation = function(tx, ty, tz) {
        return [
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            tx, ty, tz, 1
        ];
    };

    Util.xRotation = function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ];
    };

    Util.yRotation = function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ];
    };

    Util.zRotation = function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    };

    Util.scaling = function(sx, sy, sz) {
        return [
            sx, 0,  0,  0,
            0, sy,  0,  0,
            0,  0, sz,  0,
            0,  0,  0,  1
        ];
    };

    Util.translate = function(m, tx, ty, tz) {
        return Util.multiply(m, Util.translation(tx, ty, tz));
    };

    Util.xRotate = function(m, angleInRadians) {
        return Util.multiply(m, Util.xRotation(angleInRadians));
    };

    Util.yRotate = function(m, angleInRadians) {
        return Util.multiply(m, Util.yRotation(angleInRadians));
    };

    Util.zRotate = function(m, angleInRadians) {
        return Util.multiply(m, Util.zRotation(angleInRadians));
    };

    Util.scale = function(m, sx, sy, sz) {
        return Util.multiply(m, Util.scaling(sx, sy, sz));
    };
})();