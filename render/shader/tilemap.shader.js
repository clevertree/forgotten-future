"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        Input = ForgottenFuture.Input,
        // Stats = ForgottenFuture.Stats,
        Render = ForgottenFuture.Render,
        Constant = ForgottenFuture.Constant;
    var PIXELS_PER_UNIT = ForgottenFuture.Constant.PIXELS_PER_UNIT;

    var PROGRAM;

    ForgottenFuture.Render.Shader.TileMap = TileMap;
    function TileMap(gl, stage, pathLevelMap, pathTileSheet, tileSize, flags, vPosition, mVelocity, mAcceleration, vColor) {
        if(typeof flags === 'undefined')
            flags = TileMap.FLAG_DEFAULTS;

        // Variables
        var THIS =              this;
        var pixelsPerUnit =     PIXELS_PER_UNIT;
        vPosition =             vPosition || [0, 0, 0];
        var mModelView =        defaultModelViewMatrix;
        vColor =                vColor || defaultColor;
        var mMapSize =          [tileSize, tileSize];
        var vActiveColor =      vColor.slice(0);
        var vActiveColorRange = [0,0,tileSize,tileSize];

        // Set up private properties
        var mVertexPosition = getVertexPositions(1, 1);
        var mTextureCoordinates = defaultTextureCoordinates;
        var tTileSheet, iTileSheet = null;
        var tLevelMap, iLevelMap = null;
        var rowCount = 1, colCount = 1;
        var inverseSpriteTextureSize = [1,1];
        var inverseTileTextureSize = [1,1];
        var tileMapData, idLevelMapData, levelMapSize = [1,1];

        // Initiate Shader program
        if(!PROGRAM)
            initProgram(gl);

        // Create a tile sheet texture.
        tTileSheet = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tTileSheet);

        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 256, 0, 128]));

        // Asynchronously load the spritesheet
        iTileSheet = new Image();
        iTileSheet.src = pathTileSheet;
        iTileSheet.addEventListener('load', onLoadSpriteSheetTexture);


        // Load the Level Map
        tLevelMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tLevelMap);

        // Fill the texture with a 1x1 pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 256, 0, 128]));

        // Asynchronously load the spritesheet
        iLevelMap = new Image();
        iLevelMap.src = pathLevelMap;
        iLevelMap.addEventListener('load', onLoadLevelMapTexture);

        // Functions


        this.render = function(gl, mProjection, flags) {
            // Render
            gl.useProgram(PROGRAM);

            // Bind Vertex Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.bufferData(gl.ARRAY_BUFFER, mVertexPosition, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);


            // Bind Texture Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.bufferData(gl.ARRAY_BUFFER, mTextureCoordinates, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);


            // Set the projection and viewport.
            gl.uniformMatrix4fv(uPMatrix, false, mProjection);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            gl.uniform2fv(uMapSize, mMapSize);
            gl.uniform4fv(uColor, vActiveColor);
            gl.uniform4fv(uColorRange, vActiveColorRange);


            gl.uniform2fv(uInverseSpriteTextureSize, inverseSpriteTextureSize);
            gl.uniform2fv(uInverseTileTextureSize, inverseTileTextureSize);



            // Tell the shader to get the tile sheet from texture unit 0
            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uTileSheet, 0);
            gl.bindTexture(gl.TEXTURE_2D, tTileSheet);

            // Tell the shader to get the level map from texture unit 0
            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i(uLevelMap, 1);
            gl.bindTexture(gl.TEXTURE_2D, tLevelMap);

            // for(var i=0; i<2000; i++) {
            //     gl.uniformMatrix4fv(uMVMatrix, false, Util.translate(mModelView, 0, 0, -0.005*i));
            //     gl.drawArrays(gl.TRIANGLES, 0, 6);
            // }

            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            // draw the quad (2 triangles, 6 vertices)
            gl.drawArrays(gl.TRIANGLES, 0, 6);

        };

        var frameCount = 0;
        this.update = function(t, stage, flags) {
            frameCount++;

            if(mAcceleration)
                mVelocity = Util.multiply(mVelocity, mAcceleration);

            if(mVelocity)
                mModelView = Util.multiply(mModelView, mVelocity);

            if(flags & Constant.RENDER_SELECTED) {
                if(vActiveColor === vColor)
                    vActiveColor = vColor.slice(0);
                vActiveColor[0] = vColor[0] * Math.abs(Math.sin(t/500));
                vActiveColor[1] = vColor[1] * Math.abs(Math.sin(t/1800));
                vActiveColor[2] = vColor[2] * Math.abs(Math.sin(t/1000));
                vActiveColor[3] = vColor[3] * Math.abs(Math.sin(t/300));
                THIS.updateEditor(t, stage, flags);
            } else {
                vActiveColor = vColor
            }

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

        this.getTilePixel = function(x, y) {
            if(x < 0 || y < 0 || x > levelMapSize[0] || y > levelMapSize[1])
                return null;
            var pos = (x+y*levelMapSize[0])*4;
            return idLevelMapData.data.slice(pos, pos+4);
        };

        this.getPixel = function(x, y) {
            var lx = Math.floor(x/tileSize);
            var ly = Math.floor(y/tileSize);
            if(lx < 0 || ly < 0 || lx > levelMapSize[0] || ly > levelMapSize[1])
                return null;
            var tpixel = this.getTilePixel(lx, ly);
            if(!tpixel || tpixel[2] === 0)
                return tpixel;

            var tx = (tpixel[0]*tileSize) + (x%tileSize);
            var ty = (tpixel[1]*tileSize) + (y%tileSize);
            var tpos = (tx+ty*tileMapData.width)*4;
            return tileMapData.data.slice(tpos, tpos+4);
        };

        this.testHit = function(x, y, z) {
            if(z !== vPosition[2] || !idLevelMapData)
                return null;
            
            var tx = Math.round((x - vPosition[0])/tileSize * pixelsPerUnit);
            var ty = Math.round(-(y - vPosition[1])/tileSize * pixelsPerUnit);
            // console.log("Test Hit: ", x, y, ' => ', px, py, this.getPixel(px, py));
            var tpixel = this.getTilePixel(tx, ty);
            if(!tpixel || tpixel[2] < 128)
                return null;

            var px = (tpixel[0]*tileSize) + (tx%tileSize);
            var py = (tpixel[1]*tileSize) + (ty%tileSize);
            var tpos = (px+py*tileMapData.width)*4;
            var pixel = tileMapData.data.slice(tpos, tpos+4);
            if(pixel[3] < 200)
                return null;
            return pixel;
        };

        this.testHeight = function (x, y, z) {
            return this.testHit(x, y, z) ? 0 : -1;
        }

        // Editor

        this.saveEditorMap = function(left, top, width, height) {
            if(typeof left === 'undefined') left = 0;
            if(typeof top === 'undefined') top = 0;
            if(typeof width === 'undefined') width = iLevelMap.width;
            if(typeof height === 'undefined') height = iLevelMap.height;

            Util.assetSavePNG(pathLevelMap, idLevelMapData.data, left, top, width, height);
        };

        this.setEditorSelection = function(left, top, right, bottom) {
            if(left < 0) left = 0;
            if(top < 0) top = 0;
            if(right > levelMapSize[0]) right = levelMapSize[0];
            if(bottom > levelMapSize[1]) bottom = levelMapSize[1];
            if(left >= right) right = left+1;
            if(top >= bottom) bottom = top+1;
            vActiveColorRange = [tileSize*left, tileSize*top, tileSize*right, tileSize*bottom];
            return [left, top, right, bottom];
        };

        this.changeEditorPixel = function(toPixel) {
            var left = vActiveColorRange[0] / tileSize;
            var top = vActiveColorRange[1] / tileSize;
            var width = (vActiveColorRange[2] - vActiveColorRange[0]) / tileSize;
            var height = (vActiveColorRange[3] - vActiveColorRange[1]) / tileSize;

            var ppos = 0;
            for(var y=top; y<top+height; y++) {
                for(var x=left; x<left+width; x++) {
                    var pos = (x)*4 + (y)*4*levelMapSize[0];
                    idLevelMapData.data[pos+0] = toPixel[ppos+0];
                    idLevelMapData.data[pos+1] = toPixel[ppos+1];
                    idLevelMapData.data[pos+2] = toPixel[ppos+2];
                    idLevelMapData.data[pos+3] = toPixel[ppos+3];
                    ppos+=4;
                    if(ppos >= toPixel.length)
                        ppos = 0;
                }
            }

            // Upload the image into the texture.
            gl.bindTexture(gl.TEXTURE_2D, tLevelMap);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, idLevelMapData);
        };


        // Model/View

        this.setVelocity = function(vx, vy, vz) {
            mVelocity = Util.translation(vx, vy, vz);
        };

        this.setAcceleration = function(ax, ay, az) {
            if(!mVelocity)
                setVelocity(0,0,0);
            mAcceleration = Util.translation(ax, ay, az);
        };

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
            if(iLevelMap.width && iTileSheet.width) {
                var sx = iLevelMap.width * tileSize / (pixelsPerUnit);
                var sy = iLevelMap.height * tileSize / (pixelsPerUnit);
                mMapSize = [iLevelMap.width * tileSize, iLevelMap.height * tileSize];
                mModelView = Util.translate(mModelView, vPosition[0], vPosition[1], vPosition[2]);
                mModelView = Util.scale(mModelView, sx * 2, sy * 2, 1);
//                 console.log("Set Level Scale: ", sx, sy);
            }
        };

        // Textures

        function onLoadSpriteSheetTexture(e) {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, tTileSheet);
            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, iTileSheet);


            // Set the parameters so we can render any size image.

            if(flags & TileMap.FLAG_REPEAT_TILES) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }


            if(flags & TileMap.FLAG_GENERATE_MIPMAP) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                // MUST be filtered with NEAREST or tile lookup fails
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            }

            // console.log("Sprite Sheet Texture Loaded: ", image, tTileMap);

            colCount = iTileSheet.width / tileSize;
            if(colCount % 1 !== 0) console.error("Tile sheet width (" + iTileSheet.width + ") is not divisible by " + tileSize);
            rowCount = iTileSheet.height / tileSize;
            if(rowCount % 1 !== 0) console.error("Tile sheet height (" + iTileSheet.height + ") is not divisible by " + tileSize);

            inverseSpriteTextureSize = [1 / iTileSheet.width, 1 / iTileSheet.height];

            var canvas = document.createElement('canvas');
            var mapContext = canvas.getContext('2d');
            mapContext.drawImage(iTileSheet, 0, 0);
            tileMapData = mapContext.getImageData(0, 0, iTileSheet.width, iTileSheet.height);

            THIS.reset();
        }

        function onLoadLevelMapTexture(e) {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, tLevelMap);

            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, iLevelMap);

            // Set the parameters so we can render any size image.

            if(flags & TileMap.FLAG_REPEAT_MAP || true) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            levelMapSize = [iLevelMap.width, iLevelMap.height];
            inverseTileTextureSize = [1 / iLevelMap.width, 1 / iLevelMap.height];

            var canvas = document.createElement('canvas');
            var mapContext = canvas.getContext('2d');
            mapContext.drawImage(iLevelMap, 0, 0);
            idLevelMapData = mapContext.getImageData(0, 0, iLevelMap.width, iLevelMap.height);
            THIS.reset();
            // // Create a framebuffer backed by the texture
            // var framebuffer = gl.createFramebuffer();
            // gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tLevelMap, 0);
            //
            // // Read the contents of the framebuffer (data stores the pixel data)
            // var data = new Uint8Array(this.width * this.height * 4);
            // gl.readPixels(0, 0, this.width, this.height, gl.RGB, gl.UNSIGNED_BYTE, data);
            //
            // gl.deleteFramebuffer(framebuffer);
        }

        // Init

        function getVertexPositions(sx, sy) {
            sx /= 2;
            sy /= 2;

            // Put a unit quad in the buffer
            return new Float32Array([
                -0, 0,
                -0, -sy,
                sx, 0,
                sx, 0,
                -0, -sy,
                sx, -sy,
            ]);
        }

        function initProgram(gl) {

            // Init Program
            var program = Util.compileProgram(gl, TileMap.VS, TileMap.FS);
            gl.useProgram(program);

            // Enable Vertex Position Attribute.
            aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
            gl.enableVertexAttribArray(aVertexPosition);

            // Enable Texture Position Attribute.
            aTextureCoordinate = gl.getAttribLocation(program, "aTextureCoordinate");
            gl.enableVertexAttribArray(aTextureCoordinate);

            // Lookup Uniforms
            uPMatrix = gl.getUniformLocation(program, "uPMatrix");
            uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");
            uMapSize = gl.getUniformLocation(program, "uMapSize");
            uTileSheet = gl.getUniformLocation(program, "uTileSheet");
            uLevelMap = gl.getUniformLocation(program, "uLevelMap");
            uTileSize = gl.getUniformLocation(program, "uTileSize");
            uColor = gl.getUniformLocation(program, "uColor");
            uColorRange = gl.getUniformLocation(program, "uColorRange");
            uInverseTileSize = gl.getUniformLocation(program, "uInverseTileSize");
            uInverseTileTextureSize = gl.getUniformLocation(program, "uInverseTileTextureSize");
            uInverseSpriteTextureSize = gl.getUniformLocation(program, "uInverseSpriteTextureSize");

            gl.uniform1f(uTileSize, tileSize);
            gl.uniform1f(uInverseTileSize, 1/tileSize);

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

            PROGRAM = program;
        }

    }

    // Static

    var lastKeyCount = 0;
    TileMap.prototype.updateEditor = function(t, stage, flags) {

        // Press-once keys
        if(lastKeyCount < Input.keyEvents) {
            lastKeyCount = Input.keyEvents;
            console.log("Editor not enabled");
        }
    };


    TileMap.FLAG_GENERATE_MIPMAP = 0x01;
    TileMap.FLAG_REPEAT_TILES = 0x10;
    TileMap.FLAG_REPEAT_MAP = 0x20;
    TileMap.FLAG_DEFAULTS = 0x10; // TileMap.FLAG_GENERATE_MIPMAP;

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
    var uPMatrix, uMVMatrix, uMapSize, uLevelMap, uTileSheet, uTileSize, uInverseTileSize, uInverseTileTextureSize, uInverseSpriteTextureSize, uColor, uColorRange;

    // Shader
    TileMap.VS = [
        "attribute vec4 aVertexPosition;",
        "attribute vec2 aTextureCoordinate;",
        // "attribute vec4 aColor;",

        "varying vec2 vPixelCoordinate;",
        "varying vec2 vTextureCoordinate;",

        "uniform mat4 uPMatrix;",
        "uniform mat4 uMVMatrix;",
        "uniform vec2 uMapSize;",
        "uniform vec2 uInverseTileTextureSize;",
        "uniform float uInverseTileSize;",

        "void main(void) {",
        // "   vPixelCoordinate = (aTextureCoordinate * viewportSize) + viewOffset;",
        "   vPixelCoordinate = aTextureCoordinate * uMapSize;",
        "   vTextureCoordinate = vPixelCoordinate * uInverseTileTextureSize * uInverseTileSize;",
        "   gl_Position = uPMatrix * uMVMatrix * aVertexPosition;",
        // "   vColor = aColor;",
        // "   gl_Position = aVertexPosition;",
        "}"
    ].join("\n");

    TileMap.FS = [
        "precision highp float;",

        "varying vec2 vPixelCoordinate;",
        "varying vec2 vTextureCoordinate;",
        // "varying vec4 vColor;",

        "uniform sampler2D uLevelMap;",
        "uniform sampler2D uTileSheet;",
        "uniform vec4 uColor;",
        "uniform vec4 uColorRange;",

        "uniform vec2 uInverseTileTextureSize;",
        "uniform vec2 uInverseSpriteTextureSize;",
        "uniform float uTileSize;",
        // "uniform int repeatTiles;",

        "void main(void) {",
        // "   if(repeatTiles == 0 && (vTextureCoordinate.x < 0.0 || vTextureCoordinate.x > 1.0 || vTextureCoordinate.y < 0.0 || vTextureCoordinate.y > 1.0)) { discard; }",
        "   vec4 tile = texture2D(uLevelMap, vTextureCoordinate);",
        // "   if(tile.x == 1.0 && tile.y == 1.0) { discard; }",
        "   if(tile.z == 0.00) { discard; }",
        // "   if(vTextureCoordinate.y + vTextureCoordinate.x + vTextureCoordinate.x < 0.8) { discard; }",

        "   vec2 spriteOffset = floor(tile.xy * 256.0) * uTileSize;", // xy = rg
        "   vec2 spriteCoord = mod(vPixelCoordinate, uTileSize);",
        "   vec4 shader = texture2D(uTileSheet, (spriteOffset + spriteCoord) * uInverseSpriteTextureSize);", //  * vColor
        // "   shader.w *= tile.w;", //  * vColor
        // "   if(tile.x > uColorRange.x && tile.y > uColorRange.y && tile.x < uColorRange.z && tile.y < uColorRange.w)",
        "   if(vPixelCoordinate.x >= uColorRange.x && vPixelCoordinate.y >= uColorRange.y && vPixelCoordinate.x <= uColorRange.z && vPixelCoordinate.y <= uColorRange.w)",
        "       shader *= uColor;", //  * vColor

        "   if(tile.z < 0.50) { shader.w *= tile.z * 4.0; }",

        "   gl_FragColor = shader;", //  * vColor
        // "    gl_FragColor = texture2D(uTileSheet, vTextureCoordinate);",
// "   gl_FragColor = tile;",
        "}"
    ].join("\n");

})();
