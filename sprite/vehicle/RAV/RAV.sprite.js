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

    var DIR = 'sprite/vehicle/RAV/';
    var DIR_SPRITESHEET = DIR + 'RAV.spritesheet.png';

    // Extends SpritePrototype
    // Util.loadScript('render/prototype/sprite.prototype.js', function() {
    //     RAV.prototype = Object.create(Sprite.SpritePrototype.prototype, {});
    //     RAV.prototype.constructor = RAV;
    // });

    // Util.loadScript('render/shader/sprite.shader.js');

    // var HITPOINTS = [
    //     [-0.5,0.5], [0.5,0.5], [0.5,-0.5], [-0.5,-0.5]
    // ];

    Sprite.Vehicle.RAV = RAV;

    /**
     * Create a new shader instance
     * @param {WebGLRenderingContext} gl
     * @param {ForgottenFuture.Stage.StagePrototype} stage
     * @constructor
     */
    function RAV(gl, options) {
        options = options || {};
        // Sprite.SpritePrototype.call(this, gl, stage); // call parent constructor

        // Local Variables
        this.velocity       = options.velocity || [0.07, 0, 0];
        this.acceleration   = options.acceleration || [Math.random() * 0.001, -0.0001, 0];
        this.modelView      = options.modelView || Util.translation(0,0,0);

        initTexture(gl, DIR_SPRITESHEET);

        // Sprite Sheet
        initShader(gl);
    }

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
        gl.drawElements(gl.TRIANGLES, 0, VAO.count);
        VAO.unbind();
    };

    RAV.renderAll = function(gl, spriteList, mProjection) {
        // Render
        gl.useProgram(program);

        VAO.bind();

        gl.uniformMatrix4fv(uniformProjectionMatrix, false, mProjection);

        // Tell the shader to get the texture from texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, TEXTURE);
        gl.uniform1i(uniformSampler, 0);

        for(var i=0; i < spriteList.length; i++) {
            // Set the projection and viewport.
            gl.uniformMatrix4fv(uniformModelViewMatrix, false, spriteList[i].modelView);
            // gl.uniform4fv(uniformColor, defaultColor);

            gl.drawElements(gl.TRIANGLES, indexOffset[0][0], gl.UNSIGNED_BYTE, indexOffset[0][1]);
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

    // Shader


    function initShader(gl) {
        if(program)
            return program;

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

        return program;
    }

    var VAO, program,
        attrVertexPosition,
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

    // Vertex List

    var vertexList = [
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
        0.5, 0.5, 0.0,     0.0, 1.0,   0.0,

        // Tank Cannon (3D)
    ];
    var indexList = [
        1, 2, 3,
        2, 3, 4,

        5, 6, 7,
        6, 7, 8,
    ];
    var indexOffset = [
        [0, 4],
        [0, 2],
        [2, 4],
    ]
})();