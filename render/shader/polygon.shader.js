"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        // Stats = ForgottenFuture.Stats,
        Render = ForgottenFuture.Render;

    ForgottenFuture.Render.Shader.PolygonShader = PolygonShader;
    function PolygonShader(gl, aVertexPositions, iTexture, options) {
        options = options || {};

        // Variables
        this.flags              = options.flags || PolygonShader.FLAG_DEFAULTS;
        this.glLineMode         = options.glLineMode || 4;

        this.color              = options.color || defaultColor;
        this.activeColor        = options.activeColor || defaultColor.slice(0);

        // Initiate Program
        this.init(gl);

        // Set up Textures
        var tTexture = setupTexture(gl, iTexture);

        // Vertex Array Object
        var bufVertexPosition = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, aVertexPositions, gl.STATIC_DRAW);

        gl.vertexAttribPointer(PROGRAM.v2VertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(PROGRAM.v2VertexPosition);
        var vertexCount = aVertexPositions.length/4;

        // Functions

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

        };

        this.render = function(gl, mModelView, mProjection, flags) {

            // Render
            gl.useProgram(PROGRAM);

            // Bind Vertex Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);

            // Bind Texture Coordinate
            // gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            // gl.bufferData(gl.ARRAY_BUFFER, defaultTextureCoordinates, gl.DYNAMIC_DRAW);

            // Set the projection and viewport.
            gl.uniformMatrix4fv(uPMatrix, false, mProjection);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            gl.uniform4fv(uColor, this.color);

            // Tell the shader to get the texture from texture unit 0
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tTexture);
            gl.uniform1i(uSampler, 0);

            // draw the quad (2 triangles, 6 vertices)
            gl.drawArrays(this.glLineMode, 0, vertexCount);
        };

        // Vertices



        // Textures

        function setupTexture(gl, image) {
            if(image instanceof WebGLTexture)
                return image;

            if(image.texture)
                return image.texture;

            var texture = gl.createTexture();
            console.log("Setting up Polygon Texture: ", image);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            image.texture = texture;
            return texture;
        }
    }


    // Static

    PolygonShader.FLAG_GENERATE_MIPMAP = 0x01;
    PolygonShader.FLAG_DEFAULTS = 0; //PolygonSheet.FLAG_GENERATE_MIPMAP;

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


    PolygonShader.prototype.init = function(gl) {
        if(PROGRAM)
            return PROGRAM;

        // Init Program
        var program = Util.compileProgram(gl, PolygonShader.VS, PolygonShader.FS);
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


    PolygonShader.VS = [
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

    PolygonShader.FS = [
        "precision mediump float;",

        "uniform sampler2D uSampler;",
        "uniform vec4 uColor;",

        "varying vec2 vTextureCoordinate;",

        "void main() {",
        "    gl_FragColor = texture2D(uSampler, vTextureCoordinate) * uColor;",
        "}"
    ].join("\n");

})();

