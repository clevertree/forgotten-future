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
    var iTexture = Util.loadImage('sprites/vehicle/RAV/RAV.spritesheet.png');

    Sprite.Vehicle.RAV = RAV;

    /**
     * Create a new shader instance
     * @param {WebGLRenderingContext} gl
     * @param {object} options
     * @constructor
     */
    function RAV(gl, options) {
        // Sprite.SpritePrototype.call(this, gl, stages); // call parent constructor

        init(gl);

        // Options
        options = options || {};
        this.velocity       = options.velocity || [0.07, 0, 0];
        this.acceleration   = options.acceleration || [Math.random() * 0.0001, -0.0001, 0];
        this.modelView      = options.modelView || Util.translation(0,0,0);
        this.vaoOffset      = options.vaoOffset || 0;
        this.vaoCount       = options.vaoCount || RAV.indexList.length;
        this.update         = RAV.stateScripts.handleRovingMotion;
        this.platform       = options.platform;
        this.lastIndex      = [];
    }

    const vertexAttrCount = 3;

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
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniformSampler, 0);

        // draw the quad (2 triangles, 6 vertices)
        // gl.drawArrays(4, 0, vertexCount);
        // VAO.bind();

        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexList);

        gl.vertexAttribPointer(attrVertexPosition, 3, gl.FLOAT, false, 4 * 5, 0);
        gl.vertexAttribPointer(attrTextureCoordinate, 2, gl.FLOAT, false, 4 * 5, 4 * 3);


        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIndexList);

        gl.drawElements(gl.TRIANGLES, this.vaoCount,  gl.UNSIGNED_SHORT, this.vaoOffset);
        // VAO.unbind();
    };

    RAV.prototype.testHeights = function() {

        var heights = new Array(RAV.wheels.length+1);
        var heightAdjust = -1;
        for(var i=0; i<RAV.wheels.length; i++) {
            var vertexPos = RAV.wheels[i] * vertexAttrCount;

            // Test for map height
            heights[i] = this.platform.testHeight([
                this.position[0]+RAV.vertexList[vertexPos],
                this.position[1]+RAV.vertexList[vertexPos+1],
                this.position[2]
            ], this.lastIndex, i);
            if(heights[i] > heightAdjust)
                heightAdjust = heights[i];
        }

        heights[RAV.wheels.length] = heightAdjust;
        return heights;
    };


    // Physics Scripts

    RAV.stateScripts = {};
    RAV.stateScripts.handleRovingMotion = function(t) {
        // Velocity
        this.velocity[0] += this.acceleration[0];

        // Position
        this.position[0] += this.velocity[0];

        var heights = new Array(RAV.wheels.length);
        var heightAdjust = -1000;
        for(var i=0; i<RAV.wheels.length; i++) {
            var vertexPos = RAV.wheels[i] * vertexAttrCount;

            // Test for map height
            heights[i] = this.platform.testHeight([
                this.position[0]+RAV.vertexList[vertexPos],
                this.position[1]+RAV.vertexList[vertexPos+1],
                // this.position[2]
            ], this.lastIndex, i);
            if(heights[i] > heightAdjust)
                heightAdjust = heights[i];
        }


        // TODO: velocity
        if(heights[0] < -0.05) {
            // Falling
            this.update = RAV.stateScripts.handleFallingMotion;
            this.update(t);
            // console.log("Walking -> Falling: ", heights[0]);
            return;
        }

        // Roving

        // Adjust footing
        this.position[1] += heightAdjust;

        // Update Modelview
        this.modelView = Util.translation(this.position[0], this.position[1], this.position[2]);

        // mModelView = Util.translate(mModelView, this.position[0], this.position[1], this.position[2]);
        if(this.rotation) {
            // if(this.rotation[0]) this.modelView = Util.xRotate(this.modelView, this.rotation[0]);
            // if(this.rotation[1]) this.modelView = Util.yRotate(this.modelView, this.rotation[1]);
            if(this.rotation[2]) this.modelView = Util.zRotate(this.modelView, this.rotation[2]);
        }
    };
    RAV.stateScripts.handleFallingMotion = function(t) {
        // Velocity
        // this.velocity[0] += vAcceleration[0];
        // this.velocity[1] += vAcceleration[1];
        this.velocity[1] += this.platform.stage.gravity[1];

        // Position
        this.position[0] += this.velocity[0];
        this.position[1] += this.velocity[1];

        var heightAdjust = -1;
        for(var i=0; i<RAV.wheels.length; i++) {
            var vertexPos = RAV.wheels[i] * vertexAttrCount;

            // Test for map height
            var height = this.platform.testHeight([
                this.position[0]+RAV.vertexList[vertexPos],
                this.position[1]+RAV.vertexList[vertexPos+1],
                // this.position[2]
            ], this.lastIndex, i);
            if(height > heightAdjust)
                heightAdjust = height;
        }


        if(!(heightAdjust > 0)) {
            // Falling

        } else {
            // Landing
            this.position[1] += heightAdjust;

            // Hitting the ground
            if(this.velocity[1] < -0.4) {
                console.log("Bounce => y=", this.velocity[1]);
                this.velocity[1] = Math.abs(this.velocity[1]) * 0.4;

            } else {
                // Landing on the ground
                this.velocity[1] = 0;
                this.update = RAV.stateScripts.handleRovingMotion;
//                     console.log("Standing: ", this.position[0], " => ", leftHeight, rightHeight);
            }
        }
        this.modelView = Util.translation(this.position[0], this.position[1], this.position[2]);
    };

    // Group

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
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniformSampler, 0);

        for(var i=0; i < this.sprites.length; i++) {
            // Set the projection and viewport.
            gl.uniformMatrix4fv(uniformModelViewMatrix, false, this.sprites[i].modelView);
            // gl.uniform4fv(uniformColor, defaultColor);

            gl.drawElements(gl.TRIANGLES, this.sprites[i].vaoCount, gl.UNSIGNED_BYTE, this.sprites[i].vaoOffset);
        }

        VAO.unbind();
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
        console.log("Setting up Sprite Texture: ", iTexture);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, iTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    // Vertex List

    var bufVertexList, bufIndexList;
    function initVAO(gl) {
        var indexList = new Uint8ClampedArray(RAV.vertexList.length/4); // 6 * 1.5
        var indexPos = 0;
        for(var i=0; i<RAV.hitbox.length; i++) {
            for(var j=RAV.hitbox[i][0]; j<=RAV.hitbox[i][1]-2; j++) {
                indexList[indexPos+0] = j+0;
                indexList[indexPos+1] = j+1;
                indexList[indexPos+2] = j+2;
                indexPos+=3;
            }
        }

        indexList = RAV.indexList;

        // Vertex Array Object
        VAO = Util.createVertexArray(gl);

        // VAO.bind();

        // Vertex Array Object
        bufVertexList = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexList);
        gl.bufferData(gl.ARRAY_BUFFER, RAV.vertexList, gl.STATIC_DRAW);

        // Index Array Object
        bufIndexList = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIndexList);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexList, gl.STATIC_DRAW);

        // gl.vertexAttribPointer(attrVertexPosition, 3, gl.FLOAT, false, 0, 0);
        // gl.vertexAttribPointer(attrTextureCoordinate, 2, gl.FLOAT, false, 0, 0);
        // gl.vertexAttribPointer(attrRotateX, 1, gl.FLOAT, false, 0, 0);

        // VAO.unbind();
        // VAO.count = RAV.indexList.length;
    }

    RAV.vertexList = new Float32Array([
        // X    Y    Z        V    H      rotateX      ID
        // Tank Base
        -1.0, 0.0, 0.0,     1.0, 0.0,   //0.0,        // 1
         1.0, 0.0, 0.0,     1.0, 1.0,   //0.0,        // 2
        -0.5, -0.5, 0.0,    0.0, 0.0,   //0.0,        // 3
         0.5, -0.5, 0.0,    0.0, 1.0,   //0.0,        // 4

        // Tank Turret
        -0.5, 0.0, 0.0,     1.0, 0.0,   //0.0,        // 5
         0.5, 0.0, 0.0,     1.0, 1.0,   //0.0,        // 6
        -0.3, 0.5, 0.0,     0.0, 0.0,   //0.0,        // 7
         0.3, 0.5, 0.0,     0.0, 1.0,   //0.0,        // 6

        // Tank Cannon (3D)
    ]);

    RAV.indexList = new Uint16Array([
        0, 1, 2,    1, 2, 3,
        4, 5, 6,    5, 6, 7,
    ]);


    RAV.hitbox = [
        [0, 3, 'hull'],
        [4, 7, 'turret'],
    ];

    RAV.wheels = new Uint8ClampedArray([
        0, 1, 2, 3
    ]);

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

        // attrRotateX = gl.getAttribLocation(program, "attrRotateX");
        // gl.enableVertexAttribArray(attrRotateX);

        // Lookup Uniforms
        uniformProjectionMatrix = gl.getUniformLocation(program, "uniformProjectionMatrix");
        uniformModelViewMatrix = gl.getUniformLocation(program, "uniformModelViewMatrix");
        uniformSampler = gl.getUniformLocation(program, "uniformSampler");
        // uniformColor = gl.getUniformLocation(program, "uniformColor");
    }

    var attrVertexPosition,
        attrTextureCoordinate,
        attrRotateX,
        uniformProjectionMatrix,
        uniformModelViewMatrix,
        uniformSampler;
        // uniformColor;
    RAV.VS = [
        "attribute vec4 attrVertexPosition;",
        "attribute vec2 attrTextureCoordinate;",
        // "attribute float attrRotateX;",

        "uniform mat4 uniformProjectionMatrix;",
        "uniform mat4 uniformModelViewMatrix;",

        "varying vec2 varyTextureCoordinate;",
        // "varying float varyRotateX;",

        "void main() {",
        // "    vec4 v4Position = vec4(attrVertexPosition.x, attrVertexPosition.y, attrVertexPosition.z, 1.0);",
        "    gl_Position = uniformProjectionMatrix * uniformModelViewMatrix * attrVertexPosition;",
        "    varyTextureCoordinate = attrTextureCoordinate;",
        // "    varyRotateX = attrRotateX;",
        "}"
    ].join("\n");

    RAV.FS = [
        "precision mediump float;",

        "uniform sampler2D uniformSampler;",
        // "uniform vec4 uniformColor;",

        "varying vec2 varyTextureCoordinate;",

        "void main() {",
        "    gl_FragColor = texture2D(uniformSampler, varyTextureCoordinate);", // * uniformColor;",
        // "    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);", // * uniformColor;",
        "}"
    ].join("\n");

})();