"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        // Stats = ForgottenFuture.Stats,
        Render = ForgottenFuture.Render;

    ForgottenFuture.Render.Shader.PolygonShader = PolygonShader;
    function PolygonShader(gl, aVertexList, aVertexIndices, iTexture, options) {
        // options = options || {};

        // Variables
        // this.flags              = options.flags || PolygonShader.FLAG_DEFAULTS;
        // this.glLineMode         = options.glLineMode || 4;

        // this.color              = options.color || defaultColor;
        // this.activeColor        = options.activeColor || defaultColor.slice(0);

        // Initiate Program
        var program = this.init(gl);

        // Set up Textures
        var tTexture = setupTexture(gl, iTexture);


        // Vertex Array Object
        var VAO = Util.createVertexArray(gl);

        VAO.bind();

        // Vertex Array Object
        var bufVertexList = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexList);
        gl.bufferData(gl.ARRAY_BUFFER, aVertexList, gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.attrVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribPointer(program.attrTextureCoordinate, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribPointer(program.attrFlag, 1, gl.FLOAT, false, 0, 0);

        // Index Array Object
        var bufVertexIndices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufVertexIndices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, aVertexIndices, gl.STATIC_DRAW);

        // Texture Coordinates
        // var bufTextureCoordinate = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
        // gl.bufferData(gl.ARRAY_BUFFER, attrTextureCoordinates, gl.STATIC_DRAW);

        VAO.unbind();
        VAO.count = aVertexIndices / 3;



        var vertexCount = aVertexList.length/4;

        // Functions

        this.render = function(gl, mModelView, mProjection) {

            // Render
            gl.useProgram(program);

            // Bind Vertex Coordinate
            // gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexList);
            // gl.vertexAttribPointer(program.attrVertexPosition, 2, gl.FLOAT, false, 0, 0);
            // gl.vertexAttribPointer(program.attrTextureCoordinate, 2, gl.FLOAT, false, 0, 0);

            // gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            // gl.bufferData(gl.ARRAY_BUFFER, attrVertexPositions, gl.STATIC_DRAW);

            // Bind Texture Coordinate
            // gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            // gl.bufferData(gl.ARRAY_BUFFER, attrTextureCoordinates, gl.DYNAMIC_DRAW);

            // Set the projection and viewport.
            gl.uniformMatrix4fv(program.uPMatrix, false, mProjection);
            gl.uniformMatrix4fv(program.uMVMatrix, false, mModelView);
            gl.uniform4fv(program.uColor, defaultColor);

            // Tell the shader to get the texture from texture unit 0
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tTexture);
            gl.uniform1i(program.uSampler, 0);

            // draw the quad (2 triangles, 6 vertices)
            // gl.drawArrays(4, 0, vertexCount);
            VAO.bind();
            gl.drawArrays(gl.TRIANGLES, 0, VAO.count);
            VAO.unbind();
        };

        this.renderGroup = function (gl, mModelView, mProjection) {

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

    PolygonShader.prototype.init = function(gl) {
        // Init Program
        var program = Util.compileProgram(gl, PolygonShader.VS, PolygonShader.FS);
        gl.useProgram(program);

        // Enable Vertex Position Attribute.
        program.attrVertexPosition = gl.getAttribLocation(program, "attrVertexPosition");
        gl.enableVertexAttribArray(program.attrVertexPosition);

        // Enable Texture Position Attribute.
        program.attrTextureCoordinate = gl.getAttribLocation(program, "attrTextureCoordinate");
        gl.enableVertexAttribArray(program.attrTextureCoordinate);

        // Enable Texture Position Attribute.
        program.attrFlag = gl.getAttribLocation(program, "attrFlag");
        gl.enableVertexAttribArray(program.attrFlag);

        // Lookup Uniforms
        program.uPMatrix = gl.getUniformLocation(program, "uPMatrix");
        program.uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");
        program.uSampler = gl.getUniformLocation(program, "uSampler");
        program.uColor = gl.getUniformLocation(program, "uColor");

        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, mVertexCoordinates, gl.STATIC_DRAW);

        return program;
    };


    PolygonShader.VS = [
        "attribute vec4 attrVertexPosition;",
        "attribute vec2 attrTextureCoordinate;",
        "attribute float attrFlag;",

        "uniform mat4 uPMatrix;",
        "uniform mat4 uMVMatrix;",

        "varying vec2 varyTextureCoordinate;",

        "void main() {",
        "    gl_Position = uPMatrix * uMVMatrix * attrVertexPosition;",
        "    varyTextureCoordinate = attrTextureCoordinate;",
        "}"
    ].join("\n");

    PolygonShader.FS = [
        "precision mediump float;",

        "uniform sampler2D uSampler;",
        "uniform vec4 uColor;",

        "varying vec2 varyTextureCoordinate;",

        "void main() {",
        "    gl_FragColor = texture2D(uSampler, varyTextureCoordinate) * uColor;",
        "}"
    ].join("\n");

})();

