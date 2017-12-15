/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util;

    ForgottenFuture.Shader.SpriteSheet2 = SpriteSheet2;
    function SpriteSheet2(gl, pathSpriteSheet, flags) {
        if(typeof flags === 'undefined') flags = SpriteSheet2.FLAG_DEFAULTS;

        this.frames = {
            'default': defaultTextureCoordinates
        };
        var currentFrame = 'default';

        // Variables
        var glLineMode = 4; // gl.TRIANGLES;
        var vScale = [1, 1, 1];
        var spriteSheetRatio = 1;

        var mModelView =            defaultModelViewMatrix;
        var mVertexCoordinates =    getVertexCoordinates(1,1); // getVertexPositions(scale, scale);
        var vPosition = [0, 0, 0], vVelocity = null, vAcceleration = null, vRotation = null;
        var vColor =                defaultColor;
        var vActiveColor =          vColor.slice(0);

        // Initiate Shaders
        if(!PROGRAM)
            SpriteSheet2.RENDER_INIT(gl);

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
        this.render = function(t, gl, mProjection, flags) {

            // Render
            SpriteSheet2.RENDER_DEFAULT(gl,
                tSpriteSheet,
                mModelView,
                mProjection,
                mVertexCoordinates,
                this.frames[currentFrame],
                vActiveColor,
                glLineMode);
        };

        var lastTime = 0;
        this.update = function(t, flags) {
            var elapsedTime = t - lastTime;
            lastTime = t;

            // Acceleration
            if(vAcceleration) {
                if(!vVelocity) vVelocity = [0, 0, 0];
                vVelocity[0] += vAcceleration[0];
                vVelocity[1] += vAcceleration[1];
                vVelocity[2] += vAcceleration[2];
            }

            if(vVelocity) {
                vPosition[0] += vVelocity[0];
                vPosition[1] += vVelocity[1];
                vPosition[2] += vVelocity[2];
            }

            mModelView = Util.translate(defaultModelViewMatrix, vPosition[0] - vScale[0]/2, vPosition[1] - vScale[1]/2, vPosition[2]);
            if(vRotation) {
                if(vRotation[0]) mModelView = Util.xRotate(mModelView, vRotation[0]);
                if(vRotation[1]) mModelView = Util.yRotate(mModelView, vRotation[1]);
                if(vRotation[2]) mModelView = Util.zRotate(mModelView, vRotation[2]);
            }
            mModelView = Util.translate(mModelView,  -vScale[0]/2, - vScale[1]/2, 0);

            // mModelView = Util.translate(mModelView, vPosition[0], vPosition[1], vPosition[2]);

            if(flags & ForgottenFuture.Flag.RENDER_SELECTED) {
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



        this.setScale = function(sx, sy) {
            if(typeof sy === 'undefined') sy = sx;
            mVertexCoordinates = getVertexCoordinates(sx, sy);
            vScale = [sx, sy, 0];
        };

        this.getVelocity = function() { return vVelocity; };
        this.setVelocity = function(vx, vy, vz) {
            vVelocity = [vx, vy, vz];
        };

        this.getAcceleration = function() { return vAcceleration; };
        this.setAcceleration = function(ax, ay, az) {
            if(!vVelocity)
                this.setVelocity(0,0,0);
            vAcceleration = [ax, ay, az];
        };

        this.getPosition = function () { return vPosition; };
        this.setPosition = function(x, y, z) {
            vPosition = [x, y, z];
        };

        this.getRotate = function () { return vRotation; };
        this.setRotate = function(aX, aY, aZ) {
            vRotation = [aX, aY, aZ];
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
            if (flags & SpriteSheet2.FLAG_GENERATE_MIPMAP) {
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

    SpriteSheet2.FLAG_GENERATE_MIPMAP = 0x01;
    SpriteSheet2.FLAG_DEFAULTS = 0; //SpriteSheet.FLAG_GENERATE_MIPMAP;

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


    SpriteSheet2.RENDER_INIT = function(gl) {

        // Init Program
        var program = Util.compileProgram(gl, SpriteSheet2.VS, SpriteSheet2.FS);
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

    SpriteSheet2.RENDER_DEFAULT = function(gl, tSpriteSheet, mModelView, mProjection, mVertexCoordinates, mTextureCoordinates, vColor, glLineMode) {

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

    SpriteSheet2.VS = [
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

    SpriteSheet2.FS = [
        "precision mediump float;",

        "uniform sampler2D uSampler;",
        "uniform vec4 uColor;",

        "varying vec2 vTextureCoordinate;",

        "void main() {",
        "    gl_FragColor = texture2D(uSampler, vTextureCoordinate) * uColor;",
        "}"
    ].join("\n");

})();

