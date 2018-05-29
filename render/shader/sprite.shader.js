"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        // Stats = ForgottenFuture.Stats,
        Render = ForgottenFuture.Render;

    var TEXTURES = [];

    ForgottenFuture.Render.Shader.SpriteShader = SpriteShader;
    function SpriteShader(gl, pathSpriteSheet, options) {
        options = options || {};

        // Variables
        this.flags              = options.flags || SpriteShader.FLAG_DEFAULTS;
        this.frames             = options.frames || {
            'default': [defaultTextureCoordinates]
        };
        this.currentFrameName   = options.currentFrameName || 'default';
        this.frameLength        = options.frameLength || 1000;
        this.glLineMode         = options.glLineMode || 4;

        this.color              = options.color || defaultColor;
        this.activeColor        = options.activeColor || defaultColor.slice(0);

        // Initiate Program
        this.init(gl);

        // Create or get the sprites texture
        var tSpriteSheet = loadSpriteSheetTexture(pathSpriteSheet);

        // Functions
        
        var frameNo = 0;
        var mLastFrame = null;
        var lastFrameTime = 0;

        this.update = function (t, sprite, flags) {
            // Update highlight color
            if(flags & ForgottenFuture.Constant.RENDER_SELECTED) {
                if(this.activeColor === this.color)
                    this.activeColor = this.color.slice(0);
                this.activeColor[0] = this.color[0] * Math.abs(Math.sin(t/500));
                this.activeColor[1] = this.color[1] * Math.abs(Math.sin(t/1800));
                this.activeColor[2] = this.color[2] * Math.abs(Math.sin(t/1000));
                this.activeColor[3] = this.color[3] * Math.abs(Math.sin(t/300));
            } else {
                this.activeColor = this.color
            }

            // Update Frame
            if(!mLastFrame || (lastFrameTime + this.frameLength < t)) {
                lastFrameTime = t;
                var frameSequence = this.frames[this.currentFrameName];
                frameNo++;
                if(frameNo >= frameSequence.length)
                    frameNo = 0;

                mLastFrame = frameSequence[frameNo];
            }
        };

        this.render = function(gl, mModelView, mProjection, flags) {

            // Render
            gl.useProgram(PROGRAM);

            // Bind Vertex Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

            // Bind Texture Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.bufferData(gl.ARRAY_BUFFER, mLastFrame, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);

            // Set the projection and viewport.
            gl.uniformMatrix4fv(uPMatrix, false, mProjection);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            gl.uniform4fv(uColor, this.color);

            // Tell the shader to get the texture from texture unit 0
            gl.activeTexture(gl.TEXTURE0 + 0);
            gl.bindTexture(gl.TEXTURE_2D, tSpriteSheet);
            gl.uniform1i(uSampler, 0);

            // draw the quad (2 triangles, 6 vertices)
            gl.drawArrays(this.glLineMode, 0, 6);
        };



        // Textures


        function loadSpriteSheetTexture(pathSpriteSheet) {
            for(var i=0; i<TEXTURES.length; i++)
                if(TEXTURES[i][1] === pathSpriteSheet)
                    return TEXTURES[i][0];

            // Create a texture.
            var tSpriteSheet = gl.createTexture();
            tSpriteSheet.loaded = false;
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tSpriteSheet);

            // Fill the texture with a 1x1 blue pixel.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 256, 0, 128]));

            // Asynchronously load the spritesheet
            var iSpriteSheet = new Image();
            iSpriteSheet.addEventListener('load', loadTexture);
            iSpriteSheet.src = Render.baseURL + pathSpriteSheet;

            TEXTURES.push([tSpriteSheet, pathSpriteSheet]);
            return tSpriteSheet;

            function loadTexture() {
                // Now that the image has loaded make copy it to the texture.
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, tSpriteSheet);

                // Upload the image into the texture.
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, iSpriteSheet);

                // Set the parameters so we can render any size image.
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                if (this.flags & SpriteShader.FLAG_GENERATE_MIPMAP) {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.generateMipmap(gl.TEXTURE_2D);
                } else {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                }

                // THIS.ratio = iSpriteSheet.height / iSpriteSheet.width;
                // vScale[1] = vScale[0] * spriteSheetRatio;
            }
        }
    }


    // Frames

    SpriteShader.prototype.setFrameRate = function (framesPerSecond) {
        this.frameLength = 1000/framesPerSecond;
    };

    SpriteShader.prototype.setCurrentFrame = function(frameName) {
        this.currentFrameName = frameName;
    };

    SpriteShader.prototype.addFrame = function(newFrameName, left, top, right, bottom) {
        this.frames[newFrameName] = new Float32Array([
            left,    bottom,
            left,    top,
            right,   bottom,
            right,   bottom,
            left,    top,
            right,   top,
        ]);
    };

    SpriteShader.prototype.addTileFrameSequence = function(newFrameName, x, y, length, tileSizeX, tileSizeY) {
        for(var i=0; i<length; i++) {
            this.addTileFrame(newFrameName, x, y, tileSizeX, tileSizeY);
            x++;
            if(x>=tileSizeX) {
                x = 0;
                y++;
            }
        }
    };

    SpriteShader.prototype.addTileFrame = function(newFrameName, x, y, tileSizeX, tileSizeY) {
        var tileScaleX = 1 / tileSizeX;
        var tileScaleY = 1 / tileSizeY;
        if(typeof this.frames[newFrameName] === 'undefined')
            this.frames[newFrameName] = [];
        this.frames[newFrameName].push(new Float32Array([
            (x+0)*tileScaleX,   (y+1)*tileScaleY,
            (x+0)*tileScaleX,   (y+0)*tileScaleY,
            (x+1)*tileScaleX,   (y+1)*tileScaleY,
            (x+1)*tileScaleX,   (y+1)*tileScaleY,
            (x+0)*tileScaleX,   (y+0)*tileScaleY,
            (x+1)*tileScaleX,   (y+0)*tileScaleY,
        ]));
    };

    // Static

    SpriteShader.FLAG_GENERATE_MIPMAP = 0x01;
    SpriteShader.FLAG_DEFAULTS = 0; //SpriteSheet.FLAG_GENERATE_MIPMAP;

    // var defaultModelViewMatrix = Util.translation(0,0,0); //[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    var defaultColor = new Float32Array([1,1,1,1]);

    // Put texcoords in the buffer
    var defaultTextureCoordinates = new Float32Array([
        0, 1,
        0, 0,
        1, 1,
        1, 1,
        0, 0,
        1, 0,
    ]);

    var mVertexCoordinates =    new Float32Array([
        -0.5, -0.5,
        -0.5, 0.5,
        0.5, -0.5,
        0.5, -0.5,
        -0.5, 0.5,
        0.5, 0.5,
    ]);

    // Program

    var PROGRAM;
    var aVertexPosition, bufVertexPosition;
    var aTextureCoordinate, bufTextureCoordinate;
    var uPMatrix, uMVMatrix, uSampler, uColor;


    SpriteShader.prototype.init = function(gl) {
        if(PROGRAM)
            return PROGRAM;

        // Init Program
        var program = Util.compileProgram(gl, SpriteShader.VS, SpriteShader.FS);
        gl.useProgram(program);

        // Enable Vertex Position Attribute.
        aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
        gl.enableVertexAttribArray(aVertexPosition);

        // Enable Texture Position Attribute.
        aTextureCoordinate = gl.getAttribLocation(program, "aTextureCoordinate");
        gl.enableVertexAttribArray(aTextureCoordinate);

        // Lookup Uniforms
        uPMatrix = gl.getUniformLocation(program, "uPMatrix");
        uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");
        uSampler = gl.getUniformLocation(program, "uSampler");
        uColor = gl.getUniformLocation(program, "uColor");

        // Create a Vertex Position Buffer.
        bufVertexPosition = gl.createBuffer();

        // Create a Texture Coordinates Buffer
        bufTextureCoordinate = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, mVertexCoordinates, gl.STATIC_DRAW);

        PROGRAM = program;
        return PROGRAM;
    };


    SpriteShader.VS = [
        "attribute vec4 aVertexPosition;",
        "attribute vec2 aTextureCoordinate;",

        "uniform mat4 uPMatrix;",
        "uniform mat4 uMVMatrix;",

        "varying vec2 vTextureCoordinate;",

        "void main() {",
        "    gl_Position = uPMatrix * uMVMatrix * aVertexPosition;",
        "    vTextureCoordinate = aTextureCoordinate;",
        "}"
    ].join("\n");

    SpriteShader.FS = [
        "precision mediump float;",

        "uniform sampler2D uSampler;",
        "uniform vec4 uColor;",

        "varying vec2 vTextureCoordinate;",

        "void main() {",
        "    gl_FragColor = texture2D(uSampler, vTextureCoordinate) * uColor;",
        "}"
    ].join("\n");

})();

