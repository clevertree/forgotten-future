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
    function HeightMap(gl, aData0, widthPerPoint, flags) {
        if(typeof flags === 'undefined')
            flags = HeightMap.FLAG_DEFAULTS;

        widthPerPoint =         widthPerPoint || DEFAULT_WIDTH_PER_POINT;

        // Variables
        var vPosition =         [0, 0, 0];
        var m4ModelView =       defaultModelViewMatrix;
        var vHighlightColor =   defaultColor.slice(0);
        var vHighlightRange =   [64,128];

        var v2MapSize = [aData0.length * widthPerPoint, getMaxHeight(aData0)];

        // Initiate Shader program
        initProgram(gl);

        // Textures
        var tColor = PROGRAM.txDefaultColor;

        // Vertex Array Object
        var VAO = Util.createVertexArray(gl);

        VAO.bind();
        // bindTextureCoordinates();                       // Bind Texture Coordinate
        var vertexCount = bindVertexCoordinates();      // Bind Vertex Coordinate
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


            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(PROGRAM.s2TextureColor, 0);
            gl.bindTexture(gl.TEXTURE_2D, tColor);


            VAO.bind();

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);

            for(var i=200; i>-2; i--) {
                gl.uniformMatrix4fv(PROGRAM.m4ModelView, false, Util.translate(m4ModelView, 0, 0, -0.8*i));
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
            }

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


        this.setColor = function (color) {
            if(color instanceof WebGLTexture) {
                tColor = color;

            } else if (color instanceof HTMLImageElement) {
                tColor = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tColor);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, color);

            } else {
                throw new Error("Invalid Color");
            }

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
            if(spritePosition[2] !== vPosition[2])
                return null;        // Null means non-applicable

            var rx = spritePosition[0] - vPosition[0];
            var ry = spritePosition[1] - vPosition[1];
            if(rx < 0 || rx > v2MapSize[0] || ry < 0 || ry > v2MapSize[1])
                return null;

            var px = Math.floor(rx / widthPerPoint);
            var pxr = (rx / widthPerPoint) - px;
            // console.log('px pxr', px, pxr);
            // var py = Math.floor(ry * mapSize[1]);

            var leftHeight = aData0 [(px+0)] * (1-pxr);
            var rightHeight = aData0 [(px+1)] * (pxr);

            var height = (leftHeight+rightHeight);
            return (height - ry);
        };

        // this.testHit = function(x, y, z) {
        //     return this.testHeight(x, y, z) > 0;
        // };
        // Model/View

        this.setWidthPerPoint = function(newWidthPerPoint)                 {
            widthPerPoint = newWidthPerPoint;

            // TODO: rebuild verts?
        };
        // this.setRotate = function(vNewRotation)             { vRotation = vNewRotation; };
        this.setPosition = function(vNewPosition)           { vPosition = vNewPosition; };


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


        function bindVertexCoordinates() {
            var bufVertexPosition = gl.createBuffer();
            var aVertexPositions = new Float32Array(aData0.length*6);
            var vertexCount = 0;
            for(var i=0; i<aData0.length; i++) {
                var x = i * widthPerPoint;
                var y = aData0[i];
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

            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.bufferData(gl.ARRAY_BUFFER, aVertexPositions, gl.STATIC_DRAW);
            gl.vertexAttribPointer(PROGRAM.v2VertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(PROGRAM.v2VertexPosition);
            // gl.vertexAttribPointer(PROGRAM.v2TexturePosition, 2, gl.FLOAT, false, 0, 0);
            // gl.enableVertexAttribArray(PROGRAM.v2TexturePosition);

            return vertexCount;
        }

    }

    // Utils

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
        // gl.useProgram(program);

        // Enable Vertex Position Attribute.
        PROGRAM.v2VertexPosition = gl.getAttribLocation(PROGRAM, "v2VertexPosition");
        PROGRAM.v2TexturePosition = gl.getAttribLocation(PROGRAM, "v2TexturePosition");

        // Enable Texture Position Attribute.
//         PROGRAM.v2TextureCoordinate = gl.getAttribLocation(PROGRAM, "v2TextureCoordinate");
//         gl.enableVertexAttribArray(PROGRAM.v2TextureCoordinate);

        // Lookup Uniforms
        PROGRAM.m4Projection = gl.getUniformLocation(PROGRAM, "m4Projection");
        PROGRAM.m4ModelView = gl.getUniformLocation(PROGRAM, "m4ModelView");

        // Statistics
        PROGRAM.v2MapSize = gl.getUniformLocation(PROGRAM, "v2MapSize");

        // uTextureHeightData = gl.getUniformLocation(program, "uTextureHeightData");
        PROGRAM.s2TextureColor = gl.getUniformLocation(PROGRAM, "s2TextureColor");
        // uTextureHeightPattern = gl.getUniformLocation(program, "uTextureHeightPattern");

        // uLevelMap = gl.getUniformLocation(program, "uLevelMap");
        PROGRAM.v4HighlightColor = gl.getUniformLocation(PROGRAM, "v4HighlightColor");
        PROGRAM.v4HighlightRange = gl.getUniformLocation(PROGRAM, "v4HighlightRange");
        // uTextureSize = gl.getUniformLocation(program, "uTextureSize");

        PROGRAM.txDefaultColor = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, PROGRAM.txDefaultColor);

        // Fill the texture with a 1x2 pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([
                0, 0, 0, 255,     255, 255, 255, 255,
                255, 255, 255, 255,     0, 0, 0, 255]));

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Create a Vertex Position Buffer.
        // bufVertexPosition = gl.createBuffer();

        // bufVertexPosition = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
        // gl.bufferData(gl.ARRAY_BUFFER, defaultVertexPositions, gl.STATIC_DRAW);


        // Create a Texture Coordinates Buffer
        // gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
        // gl.bufferData(gl.ARRAY_BUFFER, defaultTextureCoordinates, gl.STATIC_DRAW);

        // use texture unit 0
        // gl.activeTexture(gl.TEXTURE0 + 0);

        // bind to the TEXTURE_2D bind point of texture unit 0
        // gl.bindTexture(gl.TEXTURE_2D, tTileSheet);
    }

    HeightMap.VS = [
        "attribute vec3 v2VertexPosition;",

        "uniform mat4 m4Projection;",
        "uniform mat4 m4ModelView;",

        // HeightMap statistics
        "uniform vec2 v2MapSize;",

        "varying vec2 v2TextureVarying;",

        "void main(void) {",
        // "   v2TextureVarying.x = (v2MapSize.x - v2VertexPosition.x) / v2MapSize.x;",
        // "   v2TextureVarying.y = (v2MapSize.y - v2VertexPosition.z) / v2MapSize.y;",
        "   v2TextureVarying = (v2MapSize - vec2(v2VertexPosition.x, v2VertexPosition.y - v2VertexPosition.z)) / v2MapSize * 10.0;",

        "   vec4 v4Position = vec4(v2VertexPosition.x, v2VertexPosition.y, 0.0, 1.0);", // TODO index stream?
        "   gl_Position = m4Projection * m4ModelView * v4Position;",
        "}"
    ].join("\n");

    HeightMap.FS = [
        "precision highp float;",

        "varying vec2 v2TextureVarying;",

        "uniform sampler2D s2TextureColor;",

        "uniform vec2 v2MapSize;",

        "void main(void) {",
        "   vec4 pixel = texture2D(s2TextureColor, v2TextureVarying);", //
        "   gl_FragColor = pixel;",
        // "   gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);",
        "}"


    ].join("\n");

})();


