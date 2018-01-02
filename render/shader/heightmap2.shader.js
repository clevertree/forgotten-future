"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        Render = ForgottenFuture.Render;

    // Constants
    var DEFAULT_HEIGHT = 10;
    var DEFAULT_WIDTH_PER_POINT = 0.1;

    var PROGRAM;

    Render.Shader.HeightMap2 = HeightMap2;
    function HeightMap2(gl, aData0, flags) {
        if(typeof flags === 'undefined')
            flags = HeightMap2.FLAG_DEFAULTS;

        // Variables
        var vPosition =         [0, 0, 0];
        var vScale =            [128, DEFAULT_HEIGHT, 1];
        var mModelView =        defaultModelViewMatrix;
        var vHighlightColor =   defaultColor.slice(0);
        var vHighlightRange =   [64,128];

        // Matrices
        var mVertexPosition = defaultTextureCoordinates;
        var mTextureCoordinates = defaultTextureCoordinates;

        // Textures
        var tColor = null;

        mModelView = Util.scale(mModelView, vScale[0], vScale[1], vScale[2]); // TODO: get rid of

        // Initiate Shader program
        if(!PROGRAM)
            initProgram(gl);

        // Bind Texture Coordinate
        gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
        gl.bufferData(gl.ARRAY_BUFFER, mTextureCoordinates, gl.STATIC_DRAW);
        gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);

        // Bind Vertex Coordinate
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, mVertexPosition, gl.STATIC_DRAW);
        gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

        // Functions

        this.render = function(gl, mProjection, flags) {

            // Render
            gl.useProgram(PROGRAM);

            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            // gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);

            // Bind Vertex Coordinate
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

            // Bind Texture Coordinate
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);


            // Set the projection and viewport.
            gl.uniformMatrix4fv(uPMatrix, false, mProjection);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            gl.uniform1f(uMapLength, aData0.length);

            gl.uniform4fv(uHighlightColor, vHighlightColor);
            gl.uniform2fv(uHighlightRange, vHighlightRange);


            gl.uniform1fv(uData0, aData0);
            // gl.activeTexture(gl.TEXTURE0);
            // gl.uniform1i(uTextureHeightData, 0);
            // gl.bindTexture(gl.TEXTURE_2D, tHeightData);

            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i(uTextureColor, 1);
            gl.bindTexture(gl.TEXTURE_2D, tColor);

            // gl.activeTexture(gl.TEXTURE2);
            // gl.uniform1i(uTextureHeightPattern, 0);
            // gl.bindTexture(gl.TEXTURE_2D, tHeightPattern);


            // for(var i=2000; i>-200; i--) {
            //     gl.uniformMatrix4fv(uMVMatrix, false, Util.translate(mModelView, 0, 0, -0.1*i));
            //     gl.drawArrays(gl.TRIANGLES, 0, 6);
            // }

            // draw the quad (2 triangles, 6 vertices)
            gl.drawArrays(gl.TRIANGLES, 0, 6);

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


        this.setHeightMap = function(iImageData0, widthPerPoint, height, flags) {
            var data = getHeightMapDataFromImage(iImageData0);

            this.setScale([
                data.length * (widthPerPoint || DEFAULT_WIDTH_PER_POINT),
                (height || DEFAULT_HEIGHT)
            ]);
            console.log("Auto-scale: ", data);
            aData0 = data;
            return this;
        };

        this.setColor = function (color) {
            if(color instanceof WebGLTexture) {
                tColor = color;

            } else if (color instanceof HTMLImageElement) {
                tColor = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tColor);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, color);

            } else {
                // Create a tile sheet texture.
                tColor = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tColor);

                // Fill the texture with a 1x2 pixel.
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([
                        0, 0, 0, 0,     0, 0, 0, 128,
                        255, 255, 255, 255,     255, 255, 255, 255]));
            }

            return this;
        };

        // Properties

        this.getMapLength = function()                      { return mapLength; };
        // this.getMapSize = function()                        { return mapSize; };
        // this.setMapSize = function(newLength, newHeight)    { mapSize = [newLength, newHeight]; };
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

        this.testHeight = function (x, y, z) {
            if(z !== vPosition[2])
                return null;        // Null means non-applicable

            var rx = x / vScale[0] - vPosition[0];
            if(rx < 0 || rx > 1)
                return null;

            var ry = y / vScale[1] - vPosition[1];
            if(ry < 0 || ry > 1)
                return null;

            var px = Math.floor(rx * mapLength) % aData0 .length;
            var pxr = ((rx * mapLength) - Math.floor(rx * mapLength)) % aData0 .length;
            // console.log('px pxr', px, pxr);
            // var py = Math.floor(ry * mapSize[1]);

            var leftHeight = aData0 [(px+0)] * pxr;
            var rightHeight = aData0 [(px+1)] * (1-pxr);

            var height = (leftHeight+rightHeight);
            return (height - ry);
        };

        this.testHit = function(x, y, z) {
            return this.testHeight(x, y, z) > 0;
        };
        // Model/View

        this.setScale = function(vNewScale)                 {
            vScale = vNewScale;
            mModelView = Util.scale(mModelView, vScale[0], vScale[1], vScale[2]); // TODO: clean up
        };
        // this.setRotate = function(vNewRotation)             { vRotation = vNewRotation; };
        this.setPosition = function(vNewPosition)           { vPosition = vNewPosition; };

        this.move = function(tx, ty, tz) {
            vPosition[0] += tx || 0;
            vPosition[1] += ty || 0;
            vPosition[2] += tz || 0;
            this.reset();
            console.log("Set Level Position: ", vPosition);
        };

        this.moveTo = function(x, y, z) {
            vPosition = [x || 0, y || 0, z || 0];
            this.reset();
            console.log("Set Level Position: ", vPosition);
        };


        this.reset = function() {
            mModelView = defaultModelViewMatrix;
            var sx = 1000; // iLevelMap.width * tileSize / (pixelsPerUnit);
            var sy = 100; // iLevelMap.height * tileSize / (pixelsPerUnit);
            mModelView = Util.translate(mModelView, vPosition[0], vPosition[1], vPosition[2]);
            mModelView = Util.scale(mModelView, sx * 2, sy * 2, 1);
            console.log("Set Level Scale: ", sx, sy);
        };

        // Textures

        // this.getHeightDataTexture = function () { return tHeightData; };

        this.updateHeightMap2Texture = function(imageData) {

            // Upload the image into the texture.
            gl.bindTexture(gl.TEXTURE_2D, tHeightData);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

            aData0 = new Float32Array(imageData.data.length/4);

            for(var i=0; i<imageData.data.length; i+=4) {
                aData0[i/4] =
                    imageData.data[i+0]/256
                    + imageData.data[i+1]/(256*256)
                    + imageData.data[i+2]/(256*256*256);
//                    + imageData.data[i+3]*256*256*256)
//                     /(256*256*256);
            }

            // texture.HeightMap2Data = HeightMap2Data;
//             console.log("HeightMap2 updated: ", imageData);
        };

        function loadColorTexture(pathColorTexture) {

            // Create a tile sheet texture.
            tColor = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tColor);

            // Fill the texture with a 1x2 pixel.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([
                    0, 0, 0, 0,     0, 0, 0, 128,
                    255, 255, 255, 255,     255, 255, 255, 255]));

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            if(pathColorTexture) {

                // Asynchronously load the spritesheet
                var image = new Image();
                image.srcRelative = pathColorTexture;
                image.src = image.srcRelative;
                image.addEventListener('load', onLoadTexture);
                tColor.srcImage = image;

            }

            function onLoadTexture(e) {
                vTextureSizes[2] = image.width;
                vTextureSizes[3] = image.height;

                gl.bindTexture(gl.TEXTURE_2D, tColor);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
        }
        
        function loadHeightPatternTexture() {

        }
        // Editor

        var updateEditor = function(t, stage, flags) {
            if(ForgottenFuture.Render.Shader.Editor.HeightMap2Editor) {
                var editor = new ForgottenFuture.Render.Shader.Editor.HeightMap2Editor(THIS);
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

        function initProgram(gl) {

            // Init Program
            var VAO = Util.createVertexArray(gl);

            var program = Util.compileProgram(gl, HeightMap2.VS, HeightMap2.FS);
            gl.useProgram(program);

            VAO.bind();

            // Enable Vertex Position Attribute.
            aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
            gl.enableVertexAttribArray(aVertexPosition);

            // Enable Texture Position Attribute.
            aTextureCoordinate = gl.getAttribLocation(program, "aTextureCoordinate");
            gl.enableVertexAttribArray(aTextureCoordinate);

            // Lookup Uniforms
            uPMatrix = gl.getUniformLocation(program, "uPMatrix");
            uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");

            uMapLength = gl.getUniformLocation(program, "uMapLength");

            uTextureHeightData = gl.getUniformLocation(program, "uTextureHeightData");
            uTextureColor = gl.getUniformLocation(program, "uTextureColor");
            uTextureHeightPattern = gl.getUniformLocation(program, "uTextureHeightPattern");

            // uLevelMap = gl.getUniformLocation(program, "uLevelMap");
            uHighlightColor = gl.getUniformLocation(program, "uHighlightColor");
            uHighlightRange = gl.getUniformLocation(program, "uHighlightRange");
            uTextureSize = gl.getUniformLocation(program, "uTextureSize");


            // Create a Vertex Position Buffer.
            bufVertexPosition = gl.createBuffer();

            // bufVertexPosition = gl.createBuffer();
            // gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            // gl.bufferData(gl.ARRAY_BUFFER, defaultVertexPositions, gl.STATIC_DRAW);


            // Create a Texture Coordinates Buffer
            bufTextureCoordinate = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.bufferData(gl.ARRAY_BUFFER, defaultTextureCoordinates, gl.STATIC_DRAW);

            // use texture unit 0
            gl.activeTexture(gl.TEXTURE0 + 0);

            // bind to the TEXTURE_2D bind point of texture unit 0
            // gl.bindTexture(gl.TEXTURE_2D, tTileSheet);

            VAO.unbind();

            PROGRAM = program;
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

    HeightMap2.FLAG_DEFAULTS = 0; //0x10; // HeightMap2.FLAG_GENERATE_MIPMAP;

    var defaultModelViewMatrix = Util.translation(0,0,0); //[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    var defaultColor = new Float32Array([1,1,1,1]);

    // Put texcoords in the buffer
    var defaultTextureCoordinates = new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ]);



    // Texture Program

    var aVertexPosition, bufVertexPosition;
    var aTextureCoordinate, bufTextureCoordinate;
    var uPMatrix, uMVMatrix, uMapLength,
        uData0,
        uTextureHeightData, uTextureOffset=[], uTextureColor, uTextureHeightPattern,
        uHighlightColor, uHighlightRange;

    // Shader
    HeightMap2.VS = [
        "attribute vec4 aVertexPosition;",
        "attribute vec2 aTextureCoordinate;",
        "varying vec2 vTextureCoordinate;",

        "uniform mat4 uPMatrix;",
        "uniform mat4 uMVMatrix;",

        "void main(void) {",
        "   vTextureCoordinate = aTextureCoordinate;",
        "   gl_Position = uPMatrix * uMVMatrix * aVertexPosition;",
        "}"
    ].join("\n");

    HeightMap2.FS = [
        "precision highp float;",

        // "varying vec2 vPixelCoordinate;",
        "varying vec2 vTextureCoordinate;",

        "uniform sampler2D uTextureHeightData;",
        "uniform sampler2D uTextureColor;",
        "uniform sampler2D uTextureHeightPattern;",
        "uniform sampler2D uTextureOffset[16];",

        "uniform float uMapLength;",


        "uniform vec4 uHighlightColor;",
        "uniform vec2 uHighlightRange;",
        "uniform float uTextureSize[8] ;",
        "uniform float uData0[] ;",

        "vec4 getMapHeightPixel(float index, sampler2D texture, float textureWidth, float textureHeight) {",
        "   float column = mod(index, textureWidth);",
        "   float row    = mod(floor(index / textureWidth), textureHeight);",
        "   vec2 uv = vec2(",
        "       (column + 0.5) / textureWidth,",
        "       (row    + 0.5) / textureHeight);",
        "   return texture2D(texture, uv);",
        "}",

        "void main(void) {",

        "   float index = vTextureCoordinate.x * uMapLength;",
        "   float leftIndex = floor(index);",
        // "   float rightIndex = leftIndex + 1.0;", // floor(vTextureCoordinate.x * uMapLength);",
        "   vec4 leftHeightPixel = getMapHeightPixel(leftIndex, uTextureHeightData, uTextureSize[0], uTextureSize[1]);",

        "   if(vTextureCoordinate.y > leftHeightPixel.x + 0.01) { discard; }", // Optimization

        "   vec4 rightHeightPixel = getMapHeightPixel(leftIndex + 1.0, uTextureHeightData, uTextureSize[0], uTextureSize[1]);",
        "   float leftHeight = leftHeightPixel.x + leftHeightPixel.y/256.0 + leftHeightPixel.z/65536.0;",
        "   float rightHeight = rightHeightPixel.x + rightHeightPixel.y/256.0 + rightHeightPixel.z/65536.0;",
        "   float height = (rightHeight * (index - leftIndex) + leftHeight * ((leftIndex + 1.0) - index))   ;       "   ,

        "   if(vTextureCoordinate.y > height) { discard; }",

        "   vec4 pixel = texture2D(uTextureColor, vTextureCoordinate);",
        // "   pixel.w = (leftHeightPixel.w + rightHeightPixel.w) / 2.0;",

        // "   if(uTextureSize[2] > 0.0) { pxHeight += getHeightMap2Pixel(index, uTexture1, uTextureSize[2], uTextureSize[3]);",
        // "       if(uTextureSize[4] > 0.0) { pxHeight += getHeightMap2Pixel(index, uTexture2, uTextureSize[4], uTextureSize[5]);",
        // "           if(uTextureSize[6] > 0.0) { pxHeight += getHeightMap2Pixel(index, uTexture3, uTextureSize[6], uTextureSize[7]);",
        // "   }}}",



        "   if(index >= uHighlightRange[0] && index <= uHighlightRange[1])",
        "       pixel.w = uHighlightColor.w;",

        "   gl_FragColor = pixel;", //  * vColor
        "}"


    ].join("\n");

})();


