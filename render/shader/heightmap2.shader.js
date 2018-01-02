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

    Render.Shader.HeightMap2 = HeightMap2;
    function HeightMap2(gl, aData0, widthPerPoint, flags) {
        if(typeof flags === 'undefined')
            flags = HeightMap2.FLAG_DEFAULTS;

        widthPerPoint =         widthPerPoint || DEFAULT_WIDTH_PER_POINT;

        // Variables
        var vPosition =         [0, 0, 0];
        var mModelView =        defaultModelViewMatrix;
        var vHighlightColor =   defaultColor.slice(0);
        var vHighlightRange =   [64,128];

        aData0 = new Float32Array(2048);
        for(var ii=0;ii<2048;ii++) {
            aData0[ii] = Math.random() * (ii % 64);
        }

        // Initiate Shader program
        initProgram(gl);

        // Textures
        var tColor = PROGRAM.txDefaultColor;

        // Vertex Array Object
        var VAO = Util.createVertexArray(gl);

        VAO.bind();
        bindTextureCoordinates();                       // Bind Texture Coordinate
        var vertexCount = bindVertexCoordinates();      // Bind Vertex Coordinate
        VAO.unbind();

        // Functions

        this.render = function(gl, mProjection, flags) {

            // Render
            gl.useProgram(PROGRAM);

            // Set the projection and viewport.
            gl.uniformMatrix4fv(PROGRAM.uniPMatrix, false, mProjection);
            gl.uniformMatrix4fv(PROGRAM.uniMVMatrix, false, mModelView);

            gl.uniform4fv(PROGRAM.uniHighlightColor, vHighlightColor);
            gl.uniform2fv(PROGRAM.uniHighlightRange, vHighlightRange);


            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(PROGRAM.uniTextureColor, 0);
            gl.bindTexture(gl.TEXTURE_2D, tColor);

            // for(var i=2000; i>-200; i--) {
            //     gl.uniformMatrix4fv(uniMVMatrix, false, Util.translate(mModelView, 0, 0, -0.1*i));
            //     gl.drawArrays(gl.TRIANGLES, 0, 6);
            // }

            VAO.bind();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
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


        // this.setHeightMap = function(iImageData0, widthPerPoint, height, flags) {
        //     var data = getHeightMapDataFromImage(iImageData0);
        //
        //     this.setScale([
        //         data.length * (widthPerPoint || DEFAULT_WIDTH_PER_POINT),
        //         (height || DEFAULT_HEIGHT)
        //     ]);
        //     console.log("Auto-scale: ", data);
        //     aData0 = data;
        //     return this;
        // };

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

        this.setWidthPerPoint = function(newWidthPerPoint)                 {
            widthPerPoint = newWidthPerPoint;

            // TODO: rebuild verts?
        };
        // this.setRotate = function(vNewRotation)             { vRotation = vNewRotation; };
        this.setPosition = function(vNewPosition)           { vPosition = vNewPosition; };


        // Textures

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

        function bindTextureCoordinates() {
            var bufTextureCoordinate = gl.createBuffer();
            // Put texcoords in the buffer
            var aTextureCoordinates = new Float32Array([
                0, 0,
                0, 1,
                1, 0,
                1, 0,
                0, 1,
                1, 1,
            ]);
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.bufferData(gl.ARRAY_BUFFER, aTextureCoordinates, gl.STATIC_DRAW);
            gl.vertexAttribPointer(PROGRAM.attrTextureCoordinate, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(PROGRAM.attrTextureCoordinate);            // Enable Texture Position Attribute.
        }

        function bindVertexCoordinates() {
            var bufVertexPosition = gl.createBuffer();
            var aVertexPositions = new Float32Array(aData0.length*4 + 2);
            for(var i=0; i<aData0.length; i++) {
                var x = i * widthPerPoint;
                var y = aData0[i];
                aVertexPositions[i*4+0] = x;
                aVertexPositions[i*4+1] = y;
                aVertexPositions[i*4+2] = x;
                aVertexPositions[i*4+3] = 0;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.bufferData(gl.ARRAY_BUFFER, aVertexPositions, gl.STATIC_DRAW);
            gl.vertexAttribPointer(PROGRAM.attrVertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(PROGRAM.attrVertexPosition);

            return aVertexPositions.length;
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




    // Texture Program

    // Shader

    var PROGRAM;
    function initProgram(gl) {
        if(PROGRAM)
            return;

        // Init Program
        PROGRAM = Util.compileProgram(gl, HeightMap2.VS, HeightMap2.FS);
        // gl.useProgram(program);

        // Enable Vertex Position Attribute.
        PROGRAM.attrVertexPosition = gl.getAttribLocation(PROGRAM, "attrVertexPosition");
        gl.enableVertexAttribArray(PROGRAM.attrVertexPosition);

        // Enable Texture Position Attribute.
        PROGRAM.attrTextureCoordinate = gl.getAttribLocation(PROGRAM, "attrTextureCoordinate");
        gl.enableVertexAttribArray(PROGRAM.attrTextureCoordinate);

        // Lookup Uniforms
        PROGRAM.uniPMatrix = gl.getUniformLocation(PROGRAM, "uniPMatrix");
        PROGRAM.uniMVMatrix = gl.getUniformLocation(PROGRAM, "uniMVMatrix");

        // uTextureHeightData = gl.getUniformLocation(program, "uTextureHeightData");
        PROGRAM.uniTextureColor = gl.getUniformLocation(PROGRAM, "uniTextureColor");
        // uTextureHeightPattern = gl.getUniformLocation(program, "uTextureHeightPattern");

        // uLevelMap = gl.getUniformLocation(program, "uLevelMap");
        PROGRAM.uniHighlightColor = gl.getUniformLocation(PROGRAM, "uniHighlightColor");
        PROGRAM.uniHighlightRange = gl.getUniformLocation(PROGRAM, "uniHighlightRange");
        // uTextureSize = gl.getUniformLocation(program, "uTextureSize");

        PROGRAM.txDefaultColor = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, PROGRAM.txDefaultColor);

        // Fill the texture with a 1x2 pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([
                0, 0, 0, 0,     0, 0, 0, 128,
                255, 255, 255, 255,     255, 255, 255, 255]));

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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

    HeightMap2.VS = [
        "attribute vec2 attrVertexPosition;",
        "attribute vec2 attrTextureCoordinate;",
        "varying vec2 varyTextureCoordinate;",

        "uniform mat4 uniPMatrix;",
        "uniform mat4 uniMVMatrix;",

        "void main(void) {",
        "   vec4 vPosition = uniMVMatrix * vec4(attrVertexPosition.x, attrVertexPosition.y, 0.0, 1.0);",
        "   varyTextureCoordinate = attrTextureCoordinate;",
        "   gl_Position = uniPMatrix * vPosition;",
        "}"
    ].join("\n");

    HeightMap2.FS = [
        "precision highp float;",

        "varying vec2 varyTextureCoordinate;",

        "uniform sampler2D uniTextureColor;",

        "uniform vec4 uniHighlightColor;",
        "uniform vec2 uniHighlightRange;",

        "void main(void) {",
        "   vec4 pixel = texture2D(uniTextureColor, varyTextureCoordinate);",
        "   gl_FragColor = pixel;",
        "}"


    ].join("\n");

})();


