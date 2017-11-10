/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.ColorFragment = ColorFragment;

    var PROGRAM, PRGTexture;

    function ColorFragment(mColors, mVertices, mModelView, glLineMode, mVelocity, mAcceleration) {
        // Variables
        mVertices = mVertices   || ColorFragment.V_DEFAULT;
        mModelView = mModelView || ColorFragment.MV_DEFAULT;
        mColors = mColors       || ColorFragment.C_DEFAULT;

        // Init Render Mode
        glLineMode = glLineMode || 4; //gl.TRIANGLES;

        // Set up object
        this.render = render;
        this.update = update;
        this.setVelocity = setVelocity;
        this.setAcceleration = setAcceleration;

        // Functions
        
        function setVelocity(vx, vy, vz) {
            mVelocity = Util.translation(vx, vy, vz);
        }

        function setAcceleration(ax, ay, az) {
            if(!mVelocity)
                setVelocity(0,0,0);
            mAcceleration = Util.translation(ax, ay, az);
        }

        function update(duration) {
            if(mAcceleration)
                mVelocity = Util.multiply(mVelocity, mAcceleration);

            if(mVelocity)
                mModelView = Util.multiply(mModelView, mVelocity);
        }

        function render(elapsedTime, gl, stage) {
            // Compile program
            if(!PROGRAM)
                initProgram(gl);

            // Update
            update(elapsedTime);

            gl.useProgram(PROGRAM);

            // Bind Vertex Position Buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, PROGRAM.vertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, mVertices, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(PROGRAM.vertexPosAttrib, PROGRAM.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            // Bind Color Buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, PROGRAM.triangleVertexColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, mColors, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(PROGRAM.vertexColorAttribute, PROGRAM.triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

            // Set Matrix Uniforms
            gl.uniformMatrix4fv(PROGRAM.pMatrixUniform, false, stage.mProjection || defaultProjectionMatrix);  // Set Projection
            gl.uniformMatrix4fv(PROGRAM.mvMatrixUniform, false, mModelView);  // Set World Coordinates

            // Render
            gl.drawArrays(glLineMode, 0, PROGRAM.vertexPositionBuffer.numItems); // gl.TRIANGLES, gl.POINTS, gl.LINE_LOOP
        }

        function initProgram(gl) {
            // Init Program
            PROGRAM = Util.compileProgram(gl, ColorFragment.VS, ColorFragment.FS);

            // Position Buffer
            PROGRAM.vertexPositionBuffer = gl.createBuffer();
            PROGRAM.vertexPositionBuffer.itemSize = 3;
            PROGRAM.vertexPositionBuffer.numItems = 3;

            // Color Buffer
            PROGRAM.triangleVertexColorBuffer = gl.createBuffer();
            PROGRAM.triangleVertexColorBuffer.itemSize = 4;
            PROGRAM.triangleVertexColorBuffer.numItems = 3;
            PROGRAM.vertexColorAttribute = gl.getAttribLocation(PROGRAM, "aVertexColor");
            gl.enableVertexAttribArray(PROGRAM.vertexColorAttribute);

            // Vertex Position Attribute
            PROGRAM.vertexPositionAttribute = gl.getAttribLocation(PROGRAM, "aVertexPosition");
            gl.enableVertexAttribArray(PROGRAM.vertexPositionAttribute);

            // Uniforms
            PROGRAM.pMatrixUniform = gl.getUniformLocation(PROGRAM, "uPMatrix");
            PROGRAM.mvMatrixUniform = gl.getUniformLocation(PROGRAM, "uMVMatrix");
        }
    }


    // Shapes
    ColorFragment.V_TRIANGLE_ISOSCELES = new Float32Array([           // /*  2
        0.0,  1.0,  0.0,                                                //    /\
        -1.0, -1.0,  0.0,                                               //   /. \
        1.0, -1.0,  0.0                                                 // 0/____\1
    ]);                                                                 // */
    ColorFragment.V_DEFAULT = ColorFragment.V_TRIANGLE_ISOSCELES;


    // Colors
    ColorFragment.C_DEFAULT = new Float32Array([
        1.0, 0.0, 0.0, 0.9,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0
    ]);

    ColorFragment.MV_DEFAULT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1.5, 0, -7, 1];
    var defaultProjectionMatrix = [2.4142136573791504, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0, 0, -0.20020020008087158, 0];


    // Color Program

    ColorFragment.VS = [
        "attribute vec3 aVertexPosition;",
        "attribute vec4 aVertexColor;",

        "uniform mat4 uMVMatrix;",
        "uniform mat4 uPMatrix;",

        "varying vec4 vColor;",

        "void main(void) {",
        "   gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
        "   vColor = aVertexColor;",
        "}"
    ].join("\n");

    ColorFragment.FS = [
        "precision mediump float;",

        "varying vec4 vColor;",

        "void main(void) {",
        "   gl_FragColor = vColor;",
        "}"
    ].join("\n");

})();

