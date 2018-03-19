"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        Constant = ForgottenFuture.Constant,
        Render = ForgottenFuture.Render;

    // Constants
    var DEFAULT_HEIGHT = 10;
    var DEFAULT_SCALE = [1, 1];

    Render.Shader.GridMap2D = GridMap2D;

    /**
     * @param {WebGLRenderingContext} gl
     * @param {Array} gridData
     * @param {Object=} options
     * @constructor
     */
    function GridMap2D(gl, gridData, options) {
        // Initiate Shader program
        initProgram(gl);

        options = options || {};
        this.flags              = options.flags || GridMap2D.FLAG_DEFAULTS;
        // this.widthPerPoint      = options.widthPerPoint || DEFAULT_WIDTH_PER_POINT;
        this.gridData           = gridData;

        // Textures
        this.txHeightPattern    = options.txHeightPattern || PROGRAM.txDefaultPattern;
        this.txHeightNormal     = options.txHeightNormal || PROGRAM.txDefaultPattern;
        this.txGradientPattern  = options.txGradientPattern || PROGRAM.txDefaultPattern;

        // Variables
        this.position           = options.position || [0, 0, 0];
        this.scale              = options.scale || DEFAULT_SCALE;
        var m4ModelView         = defaultModelViewMatrix;
        var m4ModelNormal       = calculateNormalMatrix(m4ModelView);
        var vHighlightColor     = defaultColor.slice(0);
        var vHighlightRange     = [64,128];

        this.size               = getGridDimensions(gridData);

        // Vertex Array Object
        var VAO                 = buildVertexArray(gl, this);

        // Functions

        this.render = function(gl, m4Projection, flags) {

            // Render
            gl.useProgram(PROGRAM);

            // Set the projection and viewport.
            gl.uniformMatrix4fv(PROGRAM.m4Projection, false, m4Projection);
            gl.uniformMatrix4fv(PROGRAM.m4ModelView, false, m4ModelView);
            gl.uniformMatrix4fv(PROGRAM.m4ModelNormal, false, m4ModelNormal);

            // GridMap2D statistics
            gl.uniform2fv(PROGRAM.v2MapSize, this.size);
            gl.uniform2fv(PROGRAM.v2MapScale, this.scale);

            // Editor Highlights
            gl.uniform4fv(PROGRAM.v4HighlightColor, vHighlightColor);
            gl.uniform2fv(PROGRAM.v4HighlightRange, vHighlightRange);


            gl.uniform1i(PROGRAM.s2HeightPattern, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.txHeightPattern);

            gl.uniform1i(PROGRAM.s2HeightNormal, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.txHeightNormal);

            gl.uniform1i(PROGRAM.s2GradientPattern, 2);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.txGradientPattern);

            gl.uniform2fv(PROGRAM.v2HeightTextureScale, [8, 8]);
            gl.uniform2fv(PROGRAM.v2HeightTextureOffset, [0, 0]);


            VAO.bind();


            for(var i=-20; i<2; i++) {
                // if(!i) continue;

                gl.uniform2fv(PROGRAM.v2MapScale, [this.scale[0], (i+20)/20]);
                gl.uniform2fv(PROGRAM.v2HeightTextureOffset, [i/10, 0]);
                gl.uniform2fv(PROGRAM.v2HeightTextureScale, [20 + 8 * Math.sin(i), 10 + 4 * Math.cos(i)]);

                gl.uniformMatrix4fv(PROGRAM.m4ModelView, false, Util.translate(m4ModelView, 0, 0, i*2));
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, VAO.count);
            }

            // gl.uniform2fv(PROGRAM.v2MapScale, this.scale);
            // gl.uniformMatrix4fv(PROGRAM.m4ModelView, false, m4ModelView);
            // gl.drawArrays(gl.TRIANGLE_STRIP, 0, VAO.count);

            VAO.unbind();

        };

        var frameCount = 0;
        this.update = function(t, stage, flags) {
            frameCount++;

            // if(mAcceleration)
            //     mVelocity = Util.multiply(mVelocity, mAcceleration);

            // if(mVelocity)
            //     mModelView = Util.multiply(mModelView, mVelocity);

            if(flags & Constant.RENDER_SELECTED) {
                vHighlightColor[0] = Math.abs(Math.sin(t/500));
                vHighlightColor[1] = Math.abs(Math.sin(t/1800));
                vHighlightColor[2] = Math.abs(Math.sin(t/1000));
                vHighlightColor[3] = Math.abs(Math.sin(t/600)/2)+0.3;
                updateEditor(t, stage, flags);
            } else {
                // vActiveColor = vColor
            }

        };

        // Textures


        this.setHeightPatternTexture = function (gl, txHeightPattern) {
            this.txHeightPattern = setupTexture(gl, txHeightPattern);
            return this;
        };

        this.setHeightNormalTexture = function (gl, txHeightNormal) {
            this.txHeightNormal = setupTexture(gl, txHeightNormal);
            return this;
        };

        this.setGradientPattern = function (gl, txHeightPattern) {
            this.txGradientPattern = setupTexture(gl, txHeightPattern);
            return this;
        };

        // Properties

        this.getViewPort = function() {
            return new Render.ViewPort.SimpleViewPort(
                function(vViewPosition) {
                    vViewPosition[0] = -vPosition[0];
                    vViewPosition[1] = -vPosition[1] + 2;
                    if(vViewPosition[2] < 2)
                        vViewPosition[2] += 0.004;
                }
            );
        };

        // Map Data

        var statGridCalc = 0;
        setInterval(function() {
            console.log("statGridCalc: ", statGridCalc);
        }, 1000);

        this.findIndexRange = function (x) {
            // Binary search
            var left = -1, right = gridData.length;
            while (1 + left !== right) {
                var mi = left + ((right - left) >> 1);
                if (gridData[mi][0] > x) {
                    right = mi;
                } else {
                    left = mi;
                }
                statGridCalc++;
            }

            return [left, right];
        };

        this.getHeight = function (x, leftIndex, rightIndex) {
            var pxr = (x - gridData[leftIndex][0]) / (gridData[rightIndex][0] - gridData[leftIndex][0]);
            var height = (gridData[leftIndex][1] * (1-pxr)+gridData[rightIndex][1] * (pxr));
            return (height);
        };

        this.testHeight = function (spritePosition) {
            if (spritePosition[0] < 0
                || spritePosition[0] > this.size[0]
                || spritePosition[1] < 0
                || spritePosition[1] > this.size[1])
                return null;
            var range = this.findIndexRange(spritePosition[0]);
            return this.getHeight(spritePosition[0], range[0], range[1]) - spritePosition[1];
        };

        // Textures

        // Editor

        var updateEditor = function(t, stage, flags) {
            if(ForgottenFuture.Render.Shader.Editor.GridMap2DEditor) {
                var editor = new ForgottenFuture.Render.Shader.Editor.GridMap2DEditor(THIS);
                updateEditor = editor.update;
                updateEditor(t, stage, flags);
                THIS.editor = editor;
            }
        };

        // Init

        // function getVertexPositions(sx, sy) {
        //     sx /= 2;
        //     sy /= 2;
        //
        //     // Put a unit quad in the buffer
        //     return new Float32Array([
        //         -0, 0,
        //         -0, sy,
        //         sx, 0,
        //         sx, 0,
        //         -0, sy,
        //         sx, sy,
        //     ]);
        // }


    }

    // Utils


    function setupTexture(gl, image) {
        if(image instanceof WebGLTexture) {
            return image;

        } else if (image instanceof HTMLImageElement) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            return texture;
        }

        throw new Error("Invalid Texture");
    }
    
    function buildVertexArray(gl, shader) {
        // Vertex Array Object
        var VAO = Util.createVertexArray(gl);

        VAO.bind();
        // bindTextureCoordinates();                       // Bind Texture Coordinate
        shader.bufVertexPosition = shader.bufVertexPosition || gl.createBuffer();
        var aVertexPositions = new Float32Array(shader.gridData.length*6);
        for(var i=0; i<shader.gridData.length; i++) {
            var x = shader.gridData[i][0]  * shader.scale[0];
            var y = shader.gridData[i][1]  * shader.scale[1];
            aVertexPositions[i*6+0] = x;
            aVertexPositions[i*6+1] = y;
            aVertexPositions[i*6+2] = y;
            // aVertexPositions[i*6+2] = y;
            aVertexPositions[i*6+3] = x;
            aVertexPositions[i*6+4] = 0;
            aVertexPositions[i*6+5] = y;
            // aVertexPositions[i*6+5] = y;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, shader.bufVertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, aVertexPositions, gl.STATIC_DRAW);

        // TODO: X coordinate buffer with 1,1,2,2,3,3,4,4... Y buffer with height,0,height,0,height,0,
        gl.vertexAttribPointer(PROGRAM.v2VertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(PROGRAM.v2VertexPosition);
        // gl.vertexAttribPointer(PROGRAM.v2TexturePosition, 2, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(PROGRAM.v2TexturePosition);

        VAO.unbind();
        VAO.count = shader.gridData.length / 2;
        return VAO;
    }

    // Static

    GridMap2D.FLAG_DEFAULTS = 0; //0x10; // GridMap2D.FLAG_GENERATE_MIPMAP;

    var defaultModelViewMatrix = Util.translation(0,0,0); //[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    var defaultColor = new Float32Array([1,1,1,1]);

    function getGridDimensions(gridData) {
        var vSize = [0,0];
        for(var i=0;i<gridData.length;i++) {
            if(gridData[i][0] > vSize[0])
                vSize[0] = gridData[i][0];
            if(gridData[i][1] > vSize[1])
                vSize[1] = gridData[i][1];
        }
        console.log("Grid Dimensions: ", vSize, this);
        return vSize;
    }


    function calculateNormalMatrix(m4) {
        m4 = mtx_inverse(m4);
        m4 = mtx_transpose(m4);
        return m4;
        // return mtx_transpose(mtx_inverse(m4ModelView));
    }


    function mtx_zero() {
        return [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ];
    }


    function mtx_transpose(a) {
        var b = mtx_zero();

        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                b[i + j*4] = a[j + i*4];
            }
        }

        return b;
    }

    function mtx_inverse(m) {
        var inv = mtx_zero();
        inv[0]  =  m[5] * m[10] * m[15] - m[5]  * m[11] * m[14] - m[9]  * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
        inv[4]  = -m[4] * m[10] * m[15] + m[4]  * m[11] * m[14] + m[8]  * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
        inv[8]  =  m[4] * m[9]  * m[15] - m[4]  * m[11] * m[13] - m[8]  * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
        inv[12] = -m[4] * m[9]  * m[14] + m[4]  * m[10] * m[13] + m[8]  * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
        inv[1]  = -m[1] * m[10] * m[15] + m[1]  * m[11] * m[14] + m[9]  * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
        inv[5]  =  m[0] * m[10] * m[15] - m[0]  * m[11] * m[14] - m[8]  * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
        inv[9]  = -m[0] * m[9]  * m[15] + m[0]  * m[11] * m[13] + m[8]  * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
        inv[13] =  m[0] * m[9]  * m[14] - m[0]  * m[10] * m[13] - m[8]  * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
        inv[2]  =  m[1] * m[6]  * m[15] - m[1]  * m[7]  * m[14] - m[5]  * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7]  - m[13] * m[3] * m[6];
        inv[6]  = -m[0] * m[6]  * m[15] + m[0]  * m[7]  * m[14] + m[4]  * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7]  + m[12] * m[3] * m[6];
        inv[10] =  m[0] * m[5]  * m[15] - m[0]  * m[7]  * m[13] - m[4]  * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7]  - m[12] * m[3] * m[5];
        inv[14] = -m[0] * m[5]  * m[14] + m[0]  * m[6]  * m[13] + m[4]  * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6]  + m[12] * m[2] * m[5];
        inv[3]  = -m[1] * m[6]  * m[11] + m[1]  * m[7]  * m[10] + m[5]  * m[2] * m[11] - m[5] * m[3] * m[10] - m[9]  * m[2] * m[7]  + m[9]  * m[3] * m[6];
        inv[7]  =  m[0] * m[6]  * m[11] - m[0]  * m[7]  * m[10] - m[4]  * m[2] * m[11] + m[4] * m[3] * m[10] + m[8]  * m[2] * m[7]  - m[8]  * m[3] * m[6];
        inv[11] = -m[0] * m[5]  * m[11] + m[0]  * m[7]  * m[9]  + m[4]  * m[1] * m[11] - m[4] * m[3] * m[9]  - m[8]  * m[1] * m[7]  + m[8]  * m[3] * m[5];
        inv[15] =  m[0] * m[5]  * m[10] - m[0]  * m[6]  * m[9]  - m[4]  * m[1] * m[10] + m[4] * m[2] * m[9]  + m[8]  * m[1] * m[6]  - m[8]  * m[2] * m[5];
        var det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

        if (det == 0) {
            console.log("Error: Non-invertible matrix");
            return mtx_zero();
        }

        det = 1.0 / det;
        for (var i = 0; i < 16; i++) {
            inv[i] *= det;
        }
        return inv;
    }

    // Texture Program

    // Shader

    var PROGRAM;
    function initProgram(gl) {
        if(PROGRAM)
            return;

        // Init Program
        PROGRAM = Util.compileProgram(gl, GridMap2D.VS, GridMap2D.FS);

        // Lookup Uniforms
        PROGRAM.v2VertexPosition = gl.getAttribLocation(PROGRAM, "v2VertexPosition");
        // PROGRAM.v2TexturePosition = gl.getAttribLocation(PROGRAM, "v2TexturePosition");
        PROGRAM.m4Projection = gl.getUniformLocation(PROGRAM, "m4Projection");
        PROGRAM.m4ModelView = gl.getUniformLocation(PROGRAM, "m4ModelView");
        PROGRAM.m4ModelNormal = gl.getUniformLocation(PROGRAM, "m4ModelNormal");

        // Statistics
        PROGRAM.v2MapSize = gl.getUniformLocation(PROGRAM, "v2MapSize");
        PROGRAM.v2MapScale = gl.getUniformLocation(PROGRAM, "v2MapScale");

        // Textures
        PROGRAM.s2HeightPattern = gl.getUniformLocation(PROGRAM, "s2HeightPattern");
        PROGRAM.s2HeightNormal = gl.getUniformLocation(PROGRAM, "s2HeightNormal");
        PROGRAM.s2GradientPattern = gl.getUniformLocation(PROGRAM, "s2GradientPattern");
        PROGRAM.v2HeightTextureScale = gl.getUniformLocation(PROGRAM, "v2HeightTextureScale");
        PROGRAM.v2HeightTextureOffset = gl.getUniformLocation(PROGRAM, "v2HeightTextureOffset");

        // Editor
        PROGRAM.v4HighlightColor = gl.getUniformLocation(PROGRAM, "v4HighlightColor");
        PROGRAM.v4HighlightRange = gl.getUniformLocation(PROGRAM, "v4HighlightRange");

        PROGRAM.txDefaultPattern = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, PROGRAM.txDefaultPattern);

        // Fill the texture with a 1x2 pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([
                50, 50, 50, 255,     50, 50, 50, 255,
                185, 185, 185, 255,     155, 155, 155, 255
            ]));

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);


    }

    GridMap2D.VS = [
        "attribute vec3 v2VertexPosition;",

        "uniform mat4 m4Projection;",
        "uniform mat4 m4ModelView;",
        "uniform mat4 m4ModelNormal;",

        // GridMap2D statistics
        "uniform vec2 v2MapSize;",
        "uniform vec2 v2MapScale;",

        "uniform vec2 v2HeightTextureScale;",
        "uniform vec2 v2HeightTextureOffset;",

        "varying vec2 v2HeightTextureVarying;",
        "varying vec2 v2GradientTextureVarying;",

        "varying vec3 ts_light_pos;", // Tangent space values
        "varying vec3 ts_view_pos;",  //
        "varying vec3 ts_frag_pos;",  //

        "mat3 transpose(in mat3 inMatrix)",
        "{",
        "    vec3 i0 = inMatrix[0];",
        "    vec3 i1 = inMatrix[1];",
        "    vec3 i2 = inMatrix[2];",

        "    mat3 outMatrix = mat3(",
        "        vec3(i0.x, i1.x, i2.x),",
        "        vec3(i0.y, i1.y, i2.y),",
        "        vec3(i0.z, i1.z, i2.z)",
        "    );",

        "    return outMatrix;",
        "}",

        "void main(void) {",
        // "   v2TextureVarying.x = (v2MapSize.x - v2VertexPosition.x) / v2MapSize.x;",
        // "   v2TextureVarying.y = (v2MapSize.y - v2VertexPosition.z) / v2MapSize.y;",
        // "   v2TextureVarying = (v2MapSize - vec2(v2VertexPosition.x, v2VertexPosition.z - v2VertexPosition.y)) / v2MapSize;",

        // Height texturing
        "   v2HeightTextureVarying = vec2(v2VertexPosition.x, v2VertexPosition.z - v2VertexPosition.y) / v2HeightTextureScale + v2HeightTextureOffset;",
        "   v2GradientTextureVarying = vec2(v2VertexPosition.x, v2VertexPosition.y) / v2MapSize;",

        "   vec4 v4Position = vec4(v2VertexPosition.x * v2MapScale.x, v2VertexPosition.y * v2MapScale.y, 0.0, 1.0);", // TODO index stream?
        "   mat4 m4ProjectionNormal = m4Projection * m4ModelNormal;",
        "   gl_Position = m4Projection * m4ModelView * v4Position;",

        // Lighting
        "   ts_frag_pos = vec3(m4ProjectionNormal * vec4(v2VertexPosition, 1.0));",
        "   vec3 vert_norm = cross(vec3( 0, -1,  0), vec3(1, 0, 0));",

        "   vec3 t = normalize(mat3(m4ProjectionNormal) * vec3(1, 0, 0));",
        "   vec3 b = normalize(mat3(m4ProjectionNormal) * vec3( 0, -1,  0));",
        "   vec3 n = normalize(mat3(m4ProjectionNormal) * vert_norm);",
        "   mat3 tbn = transpose(mat3(t, b, n));",

        "   vec3 light_pos = vec3(10, 2, 0);",
        "   ts_light_pos = tbn * light_pos;",
        // Our camera is always at the origin
        "   ts_view_pos = tbn * vec3(0, 0, 0);",
        "   ts_frag_pos = tbn * ts_frag_pos;",

        "}"
    ].join("\n");

    GridMap2D.FS = [
        "precision highp float;",

        "varying vec2 v2HeightTextureVarying;",
        "varying vec2 v2GradientTextureVarying;",
        "varying vec3 ts_light_pos;",
        "varying vec3 ts_view_pos;",
        "varying vec3 ts_frag_pos;",

        "uniform sampler2D s2HeightPattern;",
        "uniform sampler2D s2HeightNormal;",
        "uniform sampler2D s2GradientPattern;",

        "uniform vec2 v2MapSize;",

        "void main(void) {",
        "   vec4 heightPixel = texture2D(s2HeightPattern, v2HeightTextureVarying);", //
        "   vec4 normalPixel = texture2D(s2HeightNormal, v2HeightTextureVarying);", //
        "   vec4 gradientPixel = texture2D(s2GradientPattern, v2GradientTextureVarying);", //
        "   vec4 pixel = heightPixel * gradientPixel;",

        // Normal mapping
        "   vec3 light_dir = normalize(ts_light_pos - ts_frag_pos);",
        "   vec3 view_dir = normalize(ts_view_pos - ts_frag_pos);",
        "   vec3 ambient = 0.05 * heightPixel.rgb;",
        "   vec3 norm = normalize(normalPixel.rgb * 2.0 - 1.0);",
        "   float diffuse = max(dot(light_dir, norm), 0.0);",
        "   gl_FragColor = vec4(diffuse * pixel.rgb + ambient, 1.0);",

        // "   gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);",
        "}"


    ].join("\n");

})();


