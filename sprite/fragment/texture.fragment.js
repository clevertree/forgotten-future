/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.TextureFragment = TextureFragment;

    var PROGRAM;

    function TextureFragment(texture, mModelView, glLineMode, mVelocity, mAcceleration, tileSize, tilePos) {
        if(!texture)
            throw new Error("Missing Texture");

        // Init Render Mode
        glLineMode = glLineMode || 4; // gl.TRIANGLES;

        // Variables
        mModelView =            mModelView || defaultModelViewMatrix;

        // Set up object
        this.render =           render;
        this.update =           update;
        this.setVelocity =      setVelocity;
        this.setAcceleration =  setAcceleration;

        // Functions

        function render(elapsedTime, gl, stage, flags) {
            if(!PROGRAM)
                initProgram(gl);

            // Update
            update(elapsedTime, stage);

            // Render
            gl.useProgram(PROGRAM);

            // Bind Vertex Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

            // Bind Texture Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);

            // Set the projection and viewport.
            gl.uniformMatrix4fv(uPMatrix, false, stage.mProjection || defaultProjectionMatrix);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);

            // Tell the shader to get the texture from texture unit 0
            gl.uniform1i(uSampler, 0);

            // draw the quad (2 triangles, 6 vertices)
            gl.drawArrays(glLineMode, 0, 6);
        }

        function setVelocity(vx, vy, vz) {
            mVelocity = Util.translation(vx, vy, vz);
        }

        function setAcceleration(ax, ay, az) {
            if(!mVelocity)
                setVelocity(0,0,0);
            mAcceleration = Util.translation(ax, ay, az);
        }

        function update(elapsedTime, stage) {
            if(mAcceleration)
                mVelocity = Util.multiply(mVelocity, mAcceleration);

            if(mVelocity)
                mModelView = Util.multiply(mModelView, mVelocity);
        }

        function initProgram(gl) {

            // Init Program
            var program = Util.compileProgram(gl, TextureFragment.VS, TextureFragment.FS);

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

            // Create a Vertex Position Buffer.
            bufVertexPosition = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(defaultVertexPositions), gl.STATIC_DRAW);

            // Create a Texture Coordinates Buffer
            bufTextureCoordinate = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(defaultTextureCoordinates), gl.STATIC_DRAW);

            // use texture unit 0
            gl.activeTexture(gl.TEXTURE0 + 0);

            // bind to the TEXTURE_2D bind point of texture unit 0
            gl.bindTexture(gl.TEXTURE_2D, texture);

            PROGRAM = program;
        }
    }

    // Static

    var defaultModelViewMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1.5, 0, -7, 1];
    var defaultProjectionMatrix = [2.4142136573791504, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0, 0, -0.20020020008087158, 0];


    // Put a unit quad in the buffer
    var defaultVertexPositions = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ];

    // Put texcoords in the buffer
    var defaultTextureCoordinates = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ];

    // Texture Program

    var aVertexPosition, bufVertexPosition;
    var aTextureCoordinate, bufTextureCoordinate;
    var uPMatrix, uMVMatrix, uSampler;

    TextureFragment.VS = [
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

    TextureFragment.FS = [
        "precision mediump float;",

        "uniform sampler2D uSampler;",

        "varying vec2 vTextureCoordinate;",

        "void main() {",
        "    gl_FragColor = texture2D(uSampler, vTextureCoordinate);",
        "}"
    ].join("\n");

})();

