"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

// Set up script-side listeners

(function() {
    var Util            = ForgottenFuture.Util,
        Sprite          = ForgottenFuture.Sprite,
        Render          = ForgottenFuture.Render,
        pressedKeys     = ForgottenFuture.Input.pressedKeys;

    // Load textures
    var iTexture = Util.loadImage('sprite/vehicle/RAV/RAV.spritesheet.png');

    Sprite.Vehicle.RAV = RAV;

    /**
     * Create a new shader instance
     * @param {WebGLRenderingContext} gl
     * @param {object} options
     * @constructor
     */
    function RAV(gl, options) {
        // Sprite.SpritePrototype.call(this, gl, stage); // call parent constructor

        init(gl);

        // Options
        options = options || {};
        this.velocity       = options.velocity || [0.07, 0, 0];
        this.acceleration   = options.acceleration || [Math.random() * 0.001, -0.0001, 0];
        this.modelView      = options.modelView || Util.translation(0,0,0);
        this.vaoOffset      = options.vaoOffset || 0;
        this.vaoCount       = options.vaoCount || VAO.count;
    }

    /**
     * Render this instance
     * @param {WebGLRenderingContext} gl
     * @param {Array} mProjection
     */
    RAV.prototype.render = function(gl, mProjection) {
        // Render
        gl.useProgram(program);

        // Set the projection and viewport.
        gl.uniformMatrix4fv(uniformProjectionMatrix, false, mProjection);
        gl.uniformMatrix4fv(uniformModelViewMatrix, false, this.modelView);
        // gl.uniform4fv(uniformColor, defaultColor);

        // Tell the shader to get the texture from texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, TEXTURE);
        gl.uniform1i(uniformSampler, 0);

        // draw the quad (2 triangles, 6 vertices)
        // gl.drawArrays(4, 0, vertexCount);
        VAO.bind();
        gl.drawElements(gl.TRIANGLES, this.vaoCount, gl.UNSIGNED_BYTE, this.vaoOffset);
        VAO.unbind();
    };

    RAV.Group = function(gl, sprites, options) {
        this.sprites = sprites;
    };

    RAV.Group.prototype.render = function(gl, mProjection) {
        // Render
        gl.useProgram(program);

        VAO.bind();

        gl.uniformMatrix4fv(uniformProjectionMatrix, false, mProjection);

        // Tell the shader to get the texture from texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, TEXTURE);
        gl.uniform1i(uniformSampler, 0);

        for(var i=0; i < this.sprites.length; i++) {
            // Set the projection and viewport.
            gl.uniformMatrix4fv(uniformModelViewMatrix, false, this.sprites[i].modelView);
            // gl.uniform4fv(uniformColor, defaultColor);

            gl.drawElements(gl.TRIANGLES, this.sprites[i].vaoCount, gl.UNSIGNED_BYTE, this.sprites[i].vaoOffset);
        }

        VAO.unbind();
    };


    // Physics Scripts

    RAV.stateScripts = {};
    RAV.stateScripts.handleRovingMotion = function(t, platform, stage) {
        // Velocity
        this.velocity[0] += this.acceleration[0];

        // Position
        this.position[0] += this.velocity[0];

        var heights = new Array(HITPOINTS.length);
        var heightAdjust = -1;
        for(var i=0; i<HITPOINTS.length; i++) {
            // Test for map height
            heights[i] = platform.testHeight([
                this.position[0]+HITPOINTS[i][0],
                this.position[1]+HITPOINTS[i][1],
                this.position[2]
            ], this.lastIndex, i);
            if(heights[i] > heightAdjust)
                heightAdjust = heights[i];
        }


        // TODO: velocity
        if(heightAdjust < -0.05) {
            // Falling
            this.stateScript = RAV.stateScripts.handleFallingMotion;
//             console.log("Walking -> Falling: ", heightAdjust);


        } else {
            // Roving

            // Adjust footing
            this.position[1] += heightAdjust;
        }

        this.updateModelView();
    };

    // Init

    var texture = null, program = null, VAO = null;
    function init(gl) {
        if(!program) initProgram(gl);
        if(!texture) initTexture(gl);
        if(!VAO) initVAO(gl);
    }

    // Texture

    function initTexture(gl) {
        texture = gl.createTexture();
        console.log("Setting up Texture: ", iTexture);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, iTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    // Vertex List

    function initVAO(gl) {
        var vertexList = new Float32Array([
            // X    Y    Z        V    H      rotateX
            // Tank Base
            -1.0, 0.0, 0.0,     1.0, 0.0,   0.0,
            1.0, 0.0, 0.0,     1.0, 1.0,   0.0,
            -0.5, -0.5, 0.0,    0.0, 0.0,   0.0,
            0.5, -0.5, 0.0,    0.0, 1.0,   0.0,

            // Tank Turret
            -0.5, 0.0, 0.0,     1.0, 0.0,   0.0,
            0.5, 0.0, 0.0,     1.0, 1.0,   0.0,
            -0.5, 0.5, 0.0,     0.0, 0.0,   0.0,

            // Tank Cannon (3D)
        ]);
        var indexList = new Uint8ClampedArray([
            1, 2, 3,
            2, 3, 4,

            5, 6, 7,
            6, 7, 8,
        ]);

        // Vertex Array Object
        VAO = Util.createVertexArray(gl);

        VAO.bind();

        // Vertex Array Object
        var bufVertexList = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexList);
        gl.bufferData(gl.ARRAY_BUFFER, vertexList, gl.STATIC_DRAW);

        // Index Array Object
        var bufVertexIndices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufVertexIndices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexList, gl.STATIC_DRAW);


        VAO.unbind();
        VAO.count = indexList / 3;
    }

    RAV.fragments = {
        // Name     offset, count, centerX, centerY
        default:    [0, 4],
        base:       [0, 2],
        turret:     [2, 4],
    };

    // Shader

    function initProgram(gl) {
        // Initiate Program
        program = Util.compileProgram(gl, RAV.VS, RAV.FS);
        gl.useProgram(program);

        // Enable Vertex Position Attribute.
        attrVertexPosition = gl.getAttribLocation(program, "attrVertexPosition");
        gl.enableVertexAttribArray(attrVertexPosition);

        // Enable Texture Position Attribute.
        attrTextureCoordinate = gl.getAttribLocation(program, "attrTextureCoordinate");
        gl.enableVertexAttribArray(attrTextureCoordinate);

        attrRotateX = gl.getAttribLocation(program, "attrRotateX");
        gl.enableVertexAttribArray(attrRotateX);

        // Lookup Uniforms
        uniformProjectionMatrix = gl.getUniformLocation(program, "uniformProjectionMatrix");
        uniformModelViewMatrix = gl.getUniformLocation(program, "uniformModelViewMatrix");
        uniformSampler = gl.getUniformLocation(program, "uniformSampler");
        uniformColor = gl.getUniformLocation(program, "uniformColor");

        gl.enableVertexAttribArray(attrRotateX);
    }

    var attrVertexPosition,
        attrTextureCoordinate,
        attrRotateX,
        uniformProjectionMatrix,
        uniformModelViewMatrix,
        uniformSampler,
        uniformColor;
    RAV.VS = [
        "attribute vec4 attrVertexPosition;",
        "attribute vec2 attrTextureCoordinate;",
        "attribute float attrRotateX;",

        "uniform mat4 uniformProjectionMatrix;",
        "uniform mat4 uniformModelViewMatrix;",

        "varying vec2 varyTextureCoordinate;",

        "void main() {",
        "    gl_Position = uniformProjectionMatrix * uniformModelViewMatrix * attrVertexPosition;",
        "    varyTextureCoordinate = attrTextureCoordinate;",
        "}"
    ].join("\n");

    RAV.FS = [
        "precision mediump float;",

        "uniform sampler2D uniformSampler;",
        "uniform vec4 uniformColor;",

        "varying vec2 varyTextureCoordinate;",

        "void main() {",
        "    gl_FragColor = texture2D(uniformSampler, varyTextureCoordinate) * uniformColor;",
        "}"
    ].join("\n");

})();