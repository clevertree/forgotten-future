"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        Render = ForgottenFuture.Render;

    // Constants
    var DEFAULT_HEIGHT = 10;
    var DEFAULT_WIDTH_PER_POINT = 0.25;

    Render.Shader.HeightMap = HeightMap;

    /**
     * @param {WebGLRenderingContext} gl
     * @param {Array} heightData
     * @param {Object=} options
     * @constructor
     */
    function HeightMap(gl, heightData, options) {
        // Initiate Shader program
        initProgram(gl);

        options = options || {};
        this.flags              = options.flags || HeightMap.FLAG_DEFAULTS;
        this.widthPerPoint      = options.widthPerPoint || DEFAULT_WIDTH_PER_POINT;
        this.heightData         = heightData;
        // Textures
        this.txHeightPattern    = options.txHeightPattern || PROGRAM.txDefaultPattern;
        this.txGradientPattern  = options.txGradientPattern || PROGRAM.txDefaultPattern;

        // Variables
        this.position           = options.position || [0, 0, 0];
        var m4ModelView         = defaultModelViewMatrix;
        var vHighlightColor     = defaultColor.slice(0);
        var vHighlightRange     = [64,128];

        var v2MapSize           = [heightData.length * this.widthPerPoint, getMaxHeight(heightData)];


        // Vertex Array Object
        var VAO = Util.createVertexArray(gl);

        VAO.bind();
        // bindTextureCoordinates();                       // Bind Texture Coordinate
        var vertexCount = bindVertexCoordinates(gl, this);      // Bind Vertex Coordinate
        VAO.unbind();

        // Functions

        this.render = function(gl, m4Projection, flags) {

            // Render
            gl.useProgram(PROGRAM);

            // Set the projection and viewport.
            gl.uniformMatrix4fv(PROGRAM.m4Projection, false, m4Projection);
            gl.uniformMatrix4fv(PROGRAM.m4ModelView, false, m4ModelView);

            // HeightMap statistics
            gl.uniform2fv(PROGRAM.v2MapSize, v2MapSize);

            // Editor Highlights
            gl.uniform4fv(PROGRAM.v4HighlightColor, vHighlightColor);
            gl.uniform2fv(PROGRAM.v4HighlightRange, vHighlightRange);


            gl.uniform1i(PROGRAM.s2HeightPattern, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.txHeightPattern);

            gl.uniform1i(PROGRAM.s2GradientPattern, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.txGradientPattern);

            gl.uniform2fv(PROGRAM.v2HeightTextureScale, [8, 8]);
            gl.uniform2fv(PROGRAM.v2HeightTextureOffset, [0, 0]);


            VAO.bind();


            for(var i=-20; i<10; i++) {

                gl.uniform2fv(PROGRAM.v2HeightTextureOffset, [i/10, 0]);
                gl.uniform2fv(PROGRAM.v2HeightTextureScale, [20 + 8 * Math.sin(i), 10 + 4 * Math.cos(i)]);

                gl.uniformMatrix4fv(PROGRAM.m4ModelView, false, Util.translate(m4ModelView, 0, 0, i*2));
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
            }

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);

            VAO.unbind();

        };

        var frameCount = 0;
        this.update = function(t, stage, flags) {
            frameCount++;

            // if(mAcceleration)
            //     mVelocity = Util.multiply(mVelocity, mAcceleration);

            // if(mVelocity)
            //     mModelView = Util.multiply(mModelView, mVelocity);

            if(flags & ForgottenFuture.Constant.RENDER_SELECTED) {
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


        this.setHeightPattern = function (gl, txHeightPattern) {
            this.txHeightPattern = setupTexture(gl, txHeightPattern);
            return this;
        };

        this.setGradientPattern = function (gl, txHeightPattern) {
            this.txGradientPattern = setupTexture(gl, txHeightPattern);
            return this;
        };

        // Properties

        this.getHighlightRange = function()         { return vHighlightRange; };
        this.setHighlightRange = function(left, right) {
            if(left < 0 || left > mapLength) left = 0;
            if(right <= left) right = left+1;
            else if(right > mapLength) right = mapLength;
            vHighlightRange = [left, right];
        };

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

        this.testHeight = function (spritePosition) {
            if(    spritePosition[0] < 0
                || spritePosition[0] > v2MapSize[0]
                || spritePosition[1] < 0
                || spritePosition[1] > v2MapSize[1])
                return null;

            var px = Math.floor(spritePosition[0] / this.widthPerPoint);
            var pxr = (spritePosition[0] / this.widthPerPoint) - px;
            // console.log('px pxr', px, pxr);
            // var py = Math.floor(ry * mapSize[1]);

            var leftHeight = heightData [(px+0)] * (1-pxr);
            var rightHeight = heightData [(px+1)] * (pxr);

            var height = (leftHeight+rightHeight);
            return (height - spritePosition[1]);
        };

        // this.testHit = function(x, y, z) {
        //     return this.testHeight(x, y, z) > 0;
        // };
        // Model/View

        this.setWidthPerPoint = function(newWidthPerPoint)                 {
            this.widthPerPoint = newWidthPerPoint;

            // TODO: rebuild verts?
        };


        // Textures

        // Editor

        var updateEditor = function(t, stage, flags) {
            if(ForgottenFuture.Render.Shader.Editor.HeightMapEditor) {
                var editor = new ForgottenFuture.Render.Shader.Editor.HeightMapEditor(THIS);
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
    
    function bindVertexCoordinates(gl, shader) {
        shader.bufVertexPosition = shader.bufVertexPosition || gl.createBuffer();
        var aVertexPositions = new Float32Array(shader.heightData.length*6);
        var vertexCount = 0;
        for(var i=0; i<shader.heightData.length; i++) {
            var x = i * shader.widthPerPoint;
            var y = shader.heightData[i];
            aVertexPositions[i*6+0] = x;
            aVertexPositions[i*6+1] = y;
            aVertexPositions[i*6+2] = y;
            // aVertexPositions[i*6+2] = y;
            aVertexPositions[i*6+3] = x;
            aVertexPositions[i*6+4] = 0;
            aVertexPositions[i*6+5] = y;
            // aVertexPositions[i*6+5] = y;
            vertexCount += 2;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, shader.bufVertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, aVertexPositions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(PROGRAM.v2VertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(PROGRAM.v2VertexPosition);
        // gl.vertexAttribPointer(PROGRAM.v2TexturePosition, 2, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(PROGRAM.v2TexturePosition);

        return vertexCount;
    }

    function getHeightMapDataFromImage(image) {
        var canvas = document.createElement('canvas');
        var mapContext = canvas.getContext('2d');
        mapContext.drawImage(image, 0, 0);
        var pixelData = mapContext.getImageData(0, 0, image.width, image.height);

        var floatData = new Float32Array(pixelData.data.length/4);

        for(var i=0; i<pixelData.data.length; i+=4) {
            floatData[i/4] =
                pixelData.data[i+0]/256
                + pixelData.data[i+1]/(256*256)
                + pixelData.data[i+2]/(256*256*256)
                + pixelData.data[i+3]/(256*256*256*256);
//                     /(256*256*256);
        }
        return floatData;
    }


    // Static

    HeightMap.FLAG_DEFAULTS = 0; //0x10; // HeightMap.FLAG_GENERATE_MIPMAP;

    var defaultModelViewMatrix = Util.translation(0,0,0); //[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    var defaultColor = new Float32Array([1,1,1,1]);

    function getMaxHeight(aData0) {
        var maxHeight = 0;
        for(var ii=0;ii<aData0.length;ii++) {
            if(aData0[ii] > maxHeight)
                maxHeight = aData0[ii];
        }
        console.log("Max Height: ", maxHeight, this);
        return maxHeight;
    }


    // Texture Program

    // Shader

    var PROGRAM;
    function initProgram(gl) {
        if(PROGRAM)
            return;

        // Init Program
        PROGRAM = Util.compileProgram(gl, HeightMap.VS, HeightMap.FS);

        // Lookup Uniforms
        PROGRAM.v2VertexPosition = gl.getAttribLocation(PROGRAM, "v2VertexPosition");
        // PROGRAM.v2TexturePosition = gl.getAttribLocation(PROGRAM, "v2TexturePosition");
        PROGRAM.m4Projection = gl.getUniformLocation(PROGRAM, "m4Projection");
        PROGRAM.m4ModelView = gl.getUniformLocation(PROGRAM, "m4ModelView");

        // Statistics
        PROGRAM.v2MapSize = gl.getUniformLocation(PROGRAM, "v2MapSize");

        // Textures
        PROGRAM.s2HeightPattern = gl.getUniformLocation(PROGRAM, "s2HeightPattern");
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

    HeightMap.VS = [
        "attribute vec3 v2VertexPosition;",

        "uniform mat4 m4Projection;",
        "uniform mat4 m4ModelView;",

        // HeightMap statistics
        "uniform vec2 v2MapSize;",

        "uniform vec2 v2HeightTextureScale;",
        "uniform vec2 v2HeightTextureOffset;",

        "varying vec2 v2HeightTextureVarying;",
        "varying vec2 v2GradientTextureVarying;",


        "void main(void) {",
        // "   v2TextureVarying.x = (v2MapSize.x - v2VertexPosition.x) / v2MapSize.x;",
        // "   v2TextureVarying.y = (v2MapSize.y - v2VertexPosition.z) / v2MapSize.y;",
        // "   v2TextureVarying = (v2MapSize - vec2(v2VertexPosition.x, v2VertexPosition.z - v2VertexPosition.y)) / v2MapSize;",
        "   v2HeightTextureVarying = vec2(v2VertexPosition.x, v2VertexPosition.z - v2VertexPosition.y) / v2HeightTextureScale + v2HeightTextureOffset;",
        "   v2GradientTextureVarying = vec2(v2VertexPosition.x, v2VertexPosition.y) / v2MapSize;",

        "   vec4 v4Position = vec4(v2VertexPosition.x, v2VertexPosition.y, 0.0, 1.0);", // TODO index stream?
        "   gl_Position = m4Projection * m4ModelView * v4Position;",
        "}"
    ].join("\n");

    HeightMap.FS = [
        "precision highp float;",

        "varying vec2 v2HeightTextureVarying;",
        "varying vec2 v2GradientTextureVarying;",

        "uniform sampler2D s2HeightPattern;",
        "uniform sampler2D s2GradientPattern;",

        "uniform vec2 v2MapSize;",

        "void main(void) {",
        "   vec4 heightPixel = texture2D(s2HeightPattern, v2HeightTextureVarying);", //
        "   vec4 gradientPixel = texture2D(s2GradientPattern, v2GradientTextureVarying);", //
        "   gl_FragColor = heightPixel * gradientPixel;",
        // "   gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);",
        "}"


    ].join("\n");

})();


