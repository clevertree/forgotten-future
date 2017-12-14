/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.Sprite = Sprite;

    
    function Sprite(gl, pathSpriteSheet, flags, mModelView, mVelocity, mAcceleration) {
        if(typeof flags === 'undefined') flags = Sprite.FLAG_DEFAULTS;

        this.frames = {
            'default': defaultTextureCoordinates
        };
        var currentFrame = 'default';

        // Variables
        var glLineMode = 4; // gl.TRIANGLES;
        var scale = [1, 1];
        var spriteSheetRatio = 1;

        mModelView =                mModelView || defaultModelViewMatrix;
        var mVertexCoordinates =    getVertexCoordinates(1,1); // getVertexPositions(scale, scale);
        var vColor =                defaultColor;
        var vActiveColor =          vColor.slice(0);

        // Initiate Shaders
        if(!PROGRAM)
            Sprite.RENDER_INIT(gl);

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
        iSpriteSheet.src = pathSpriteSheet;
        iSpriteSheet.addEventListener('load', loadTexture);

        // Functions
        
        var frameUpdated = true;
        this.render = function(t, gl, stage, flags) {

            // Update
            this.update(t, stage, flags);

            // Render
            Sprite.RENDER_DEFAULT(gl,
                tSpriteSheet,
                mModelView,
                stage.mProjection,
                mVertexCoordinates,
                this.frames[currentFrame],
                vActiveColor,
                glLineMode);
        };

        this.setScale = function(sx, sy) {
            if(typeof sy === 'undefined') sy = sx;
            mVertexCoordinates = getVertexCoordinates(sx, sy);
        };

        this.setVelocity = function(vx, vy, vz) {
            mVelocity = Util.translation(vx, vy, vz);
        };

        this.setAcceleration = function(ax, ay, az) {
            if(!mVelocity)
                setVelocity(0,0,0);
            mAcceleration = Util.translation(ax, ay, az);
        };

        var lastTime = 0;
        this.update = function(t, stage, flags) {
            var elapsedTime = t - lastTime;
            lastTime = t;

            if(mAcceleration)
                mVelocity = Util.multiply(mVelocity, mAcceleration);

            if(mVelocity)
                mModelView = Util.multiply(mModelView, mVelocity);

            if(flags & Config.flags.RENDER_SELECTED) {
                if(vActiveColor === vColor)
                    vActiveColor = vColor.slice(0);
                vActiveColor[0] = vColor[0] * Math.abs(Math.sin(t/500));
                vActiveColor[1] = vColor[1] * Math.abs(Math.sin(t/1800));
                vActiveColor[2] = vColor[2] * Math.abs(Math.sin(t/1000));
                vActiveColor[3] = vColor[3] * Math.abs(Math.sin(t/300));
            } else {
                vActiveColor = vColor
            }
        };

        function reset() {
            mModelView = defaultModelViewMatrix;
        }

        this.move = function(mDistance) {
            mModelView = Util.translate(mModelView, mDistance[0], mDistance[1], mDistance[2]);
        };

        this.rotate = function(aX, aY, aZ) {
            if(aX) mModelView = Util.xRotate(mModelView, aX);
            if(aY) mModelView = Util.yRotate(mModelView, aY);
            if(aZ) mModelView = Util.zRotate(mModelView, aZ);
        };


        // Frames


        this.setCurrentFrame = function(frameName) {
            currentFrame = frameName;
            frameUpdated = true;
        };
        
        this.getCurrentFrame = function() {
            return currentFrame;
        };

        this.addFrame = function(newFrameName, left, top, right, bottom) {
            this.frames[newFrameName] = new Float32Array([
                left,    bottom,
                left,    top,
                right,   bottom,
                right,   bottom,
                left,    top,
                right,   top,
            ]);
        };

        this.addTileFrame = function(newFrameName, x, y, tileSizeX, tileSizeY) {
            var tileScaleX = tileSizeX / iSpriteSheet.width;
            var tileScaleY = tileSizeY / iSpriteSheet.height;
            this.frames[newFrameName] = new Float32Array([
                (x+0)*tileScaleX,   (y+1)*tileScaleY,
                (x+0)*tileScaleX,   (y+0)*tileScaleY,
                (x+1)*tileScaleX,   (y+1)*tileScaleY,
                (x+1)*tileScaleX,   (y+1)*tileScaleY,
                (x+0)*tileScaleX,   (y+0)*tileScaleY,
                (x+1)*tileScaleX,   (y+0)*tileScaleY,
            ]);
        };

        // Textures


        function loadTexture() {
            // Now that the image has loaded make copy it to the texture.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tSpriteSheet);

            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, iSpriteSheet);

            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            if (flags & Sprite.FLAG_GENERATE_MIPMAP) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            }

            spriteSheetRatio = iSpriteSheet.height / iSpriteSheet.width;

        }
    }

    // Static

    Sprite.FLAG_GENERATE_MIPMAP = 0x01;
    Sprite.FLAG_DEFAULTS = 0; //SpriteSheet.FLAG_GENERATE_MIPMAP;

    var defaultModelViewMatrix = Util.translation(0,0,0); //[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    // Static Functions


    // Put texcoords in the buffer
    var defaultTextureCoordinates = new Float32Array([
        0, 1,
        0, 0,
        1, 1,
        1, 1,
        0, 0,
        1, 0,
    ]);


    function getVertexCoordinates(sx, sy) {
        // Put a unit quad in the buffer
        return new Float32Array([
            -0, -0,
            -0, sy,
            sx, -0,
            sx, -0,
            -0, sy,
            sx, sy,
        ]);
    }

    var defaultColor = new Float32Array([1,1,1,1]);
    // Texture Program


    // Program

    var PROGRAM;
    var aVertexPosition, bufVertexPosition;
    var aTextureCoordinate, bufTextureCoordinate;
    var uPMatrix, uMVMatrix, uSampler, uColor;


    Sprite.RENDER_INIT = function(gl) {

        // Init Program
        var program = Util.compileProgram(gl, Sprite.VS, Sprite.FS);
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

        PROGRAM = program;
    };

    Sprite.RENDER_DEFAULT = function(gl, tSpriteSheet, mModelView, mProjection, mVertexCoordinates, mTextureCoordinates, vColor, glLineMode) {

        // Render
        gl.useProgram(PROGRAM);

        // Bind Vertex Coordinate
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
        if(mVertexCoordinates)
            gl.bufferData(gl.ARRAY_BUFFER, mVertexCoordinates, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

        // Bind Texture Coordinate
        gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
        if(mTextureCoordinates)
            gl.bufferData(gl.ARRAY_BUFFER, mTextureCoordinates, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);

        // Set the projection and viewport.
        gl.uniformMatrix4fv(uPMatrix, false, mProjection);
        gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
        gl.uniform4fv(uColor, vColor);

        // Tell the shader to get the texture from texture unit 0
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_2D, tSpriteSheet);
        gl.uniform1i(uSampler, 0);

        // draw the quad (2 triangles, 6 vertices)
        gl.drawArrays(glLineMode, 0, 6);
    };

    Sprite.VS = [
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

    Sprite.FS = [
        "precision mediump float;",

        "uniform sampler2D uSampler;",
        "uniform vec4 uColor;",

        "varying vec2 vTextureCoordinate;",

        "void main() {",
        "    gl_FragColor = texture2D(uSampler, vTextureCoordinate) * uColor;",
        "}"
    ].join("\n");

})();

