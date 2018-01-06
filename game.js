"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

// Set up script-side listeners

var ForgottenFuture = {
    Render: {
        Shader: {
            Editor:{}
        },
        ViewPort: {},
        gl: null,
        canvas: null,
        widthToHeightRatio: 1,
    },
    Sprite: {
        Character: {},
        Vehicle: {},
        Physics: {}
    }, 
    Input: { 
        pressedKeys:{}, 
        keyCount: {}, 
        keyEvents: 0, 
        lastKey: null,
    },
    Stage: {},
    Util: {
        
    },
    Constant: {

        // Flags
        MODE_DEFAULT: 0x00,
        MODE_EDITOR: 0x01,
        MODE_CONSOLE: 0x02,

        RENDER_SELECTED: 0x10,

        // Stage Constants
        STAGE_DEFAULT: 'Stage1',

        // Render Constants
        PIXELS_PER_UNIT: 256,

        Key: {
            CHAR_SHIFT: 16, CHAR_CTRL: 17, CHAR_ALT: 18
        }
    }
};

(function() {
    var Util = ForgottenFuture.Util,
        Render = ForgottenFuture.Render,
        Input = ForgottenFuture.Input;
    var pressedKeys = ForgottenFuture.Input.pressedKeys, keyCount = ForgottenFuture.Input.keyCount;
    ForgottenFuture.play = play;

    // Event Handlers

    document.addEventListener('response:play', handlePlayResponse);
    document.addEventListener('keydown', handleKeyDown); // TODO: too strong?
    document.addEventListener('keyup', handleKeyUp);

    window.addEventListener('resize', handleWindowResize);

    function init() {
        Util.loadStyleSheet('site/assets/game.css');
        console.info("Forgotten Future initiated", ForgottenFuture);
    }

    // Canvas Loading


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
            Input.keyEvents++;
            Input.lastKey = e.keyCode;
        }
    }

    function handleKeyUp(e) {
        pressedKeys[e.keyCode] = false;
        // Input.keyEvents++;
        // e.preventDefault();
    }

    /**
     * Launch the game
     * @param {String=} stageName Specify which stage to load
     * @param {HTMLCanvasElement=} canvas Specify the canvas to render the game on
     */
    function play(stageName, canvas) {
        stageName = stageName || ForgottenFuture.Constant.STAGE_DEFAULT;
        var stagePath = 'stage/' + stageName.toLowerCase() + '/' + stageName.toLowerCase() + '.stage.js';
        // console.info("Loading stage file: " + stagePath);

        if(!canvas) {
            if(!document.body)
                throw new Error("DOM isn't loaded yet. Be patient... or try document.addEventListener(\"DOMContentLoaded\", function() {");
            canvas = document.createElement('canvas');
            canvas.setAttribute('class', 'ff-default-canvas fullscreen');

            // Event listeners
            // canvas.addEventListener('click', handleClickEvent);

            // Append to DOM
            document.body.appendChild(canvas);
        }

        var gl = canvas.getContext('webgl');

        Render.canvas = canvas;
        Render.gl = gl;


        Util.loadScript(stagePath, function() {
            // Wait for all other loading scripts to load
            Util.waitForLoadingScripts(function() {
                // Initiate the stage
                var stage = new ForgottenFuture.Stage[stageName](gl);

                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
                Render.widthToHeightRatio = canvas.width / canvas.height;

                // Start rendering
                window.requestAnimationFrame(onFrame);
                function onFrame(t) {
                    window.requestAnimationFrame(onFrame);
                    stage.update(t);
                    stage.render(gl, t);
                }

                console.info("Stage '" + stageName + "' rendering", stage);
            });
        });
    }


    function handleWindowResize(e) {
        var canvas = Render.canvas;
        if(canvas) {
            var gl = Render.gl;
            if(canvas.classList.contains('fullscreen')) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
                Render.widthToHeightRatio = canvas.width / canvas.height;
//                 console.log("Resized: ", canvas, canvas.width, canvas.height, Render.widthToHeightRatio);
            }
        }
    }

    // function handleClickEvent(e) {
    //     if(e.target.nodeName.toLowerCase() !== 'canvas')
    //         return;
    //     var canvas = e.target;
    //     if(!canvas.classList.contains("play:canvas"))
    //         return;
    //         // elemLeft = canvas.offsetLeft,
    //         // elemTop = canvas.offsetTop;
    //     var x = event.pageX - canvas.offsetLeft,
    //         y = event.pageY - canvas.offsetTop;
    //     console.log("Click:", x, y);
    // }

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

    // Vertex Array Objects

    Util.createVertexArray = function(gl) {
        var vao = null;
        if(gl.createVertexArray) {
            vao = gl.createVertexArray();
            vao.bind = function() { gl.bindVertexArray(this); };
            vao.unbind = function() { gl.bindVertexArray(null); };
        } else {
            var ext = gl.getExtension("OES_vertex_array_object");
            vao = ext.createVertexArrayOES();
            vao.bind = function() { ext.bindVertexArrayOES(this); };
            vao.unbind = function() { ext.bindVertexArrayOES(null); };
        }
        return vao;
    };

    // Script Loading

    var scriptsLoading = 0, scriptCallbacks = [];
    Util.waitForLoadingScripts = function(callback) {
        if(scriptsLoading > 0) {
            scriptCallbacks.push(callback);
        } else {
            callback();
        }
    };



    Util.loadStyleSheet = function(cssPath) {
        var cssPathEsc = cssPath.replace(/[/.]/g, '\\$&');
        var foundCSS = document.head.querySelectorAll('link[href=' + cssPathEsc + ']');
        if (foundCSS.length === 0) {
//                 console.log("Including " + scriptPath);
            var linkElm = document.createElement('link');
            linkElm.setAttribute('rel', 'stylesheet');
            linkElm.setAttribute('type', 'text/css');
            linkElm.setAttribute('href', cssPath);
            document.head.appendChild(linkElm);
        }
    };

    function completeScriptCallbacks(e) {
        if(scriptsLoading === 0 && scriptCallbacks.length > 0) {
            var callbacks = scriptCallbacks;
            scriptCallbacks = [];
            for(var i=0; i<callbacks.length; i++)
                callbacks[i](e);
        }
    }

    Util.loadScript = function(scriptPath, callback) {
        if(Array.isArray(scriptPath)) {
            for(var i=0; i<scriptPath.length; i++)
                Util.loadScript(scriptPath[i], callback);
        } else {
            var scriptPathEsc = scriptPath.replace(/[/.]/g, '\\$&');
            var foundScript = document.head.querySelectorAll('script[src=' + scriptPathEsc + ']');
            if (foundScript.length === 0) {
//             console.log("Including Script " + scriptPath);
                var scriptElm = document.createElement('script');
                scriptElm.src = scriptPath;
                scriptElm.onload = function(e) {
                    scriptsLoading--;
                    if(callback) callback(e);
                    completeScriptCallbacks(e);
                };
                document.head.appendChild(scriptElm);
                scriptsLoading++;
            } else {
                if(callback)
                    Util.waitForLoadingScripts(callback);
            }
        }
        return scriptsLoading;
    };


    // Image Loading


    Util.getDataFromImage = function(image) {
        var canvas = document.createElement('canvas');
        var mapContext = canvas.getContext('2d');
        mapContext.drawImage(image, 0, 0);
        return mapContext.getImageData(0, 0, image.width, image.height);
    };

    Util.loadImage = function(imagePath, callback) {
        // Asynchronously load an image
        var image = new Image();
        scriptsLoading++;
        image.addEventListener('load', function(e) {
            scriptsLoading--;
            if(callback) callback(e);
            completeScriptCallbacks(e);
        });
        image.src = imagePath;
        return image;
    };

    // Editor Utils

    /**
     * @deprecated
     */
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
        xhttp.open("POST", 'site/script/interface.php', true);
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

    // Initiate
    init();
})();