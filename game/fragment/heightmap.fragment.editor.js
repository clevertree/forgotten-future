/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.editor.HeightMapEditor = HeightMapEditor;
    var PIXELS_PER_UNIT = Config.constants.PIXELS_PER_UNIT;

    var keyConstants = Config.input.keyConstants;
    var lastKeyCount = 0;

    function HeightMapEditor(heightMap) {
        var HeightMap = Config.fragment.HeightMap;
        if(!heightMap instanceof HeightMap)
            throw new Error("Invalid Height Map: ", heightMap);

        var THIS = this;
        var selectedTexture = 0;

        this.update = function(t, stage, flags) {

            var V = 1;
            var PK = Config.input.pressedKeys;
            var ctrl = PK[keyConstants.CHAR_CTRL] ? 1 : 0;
            var alt = PK[keyConstants.CHAR_ALT] ? 1 : 0;
            var shift = PK[keyConstants.CHAR_SHIFT] ? V : 0;

            var allowHold = !ctrl;

            var texture = heightMap.getHeightDataTexture();

            // Press-once keys
            if(lastKeyCount < Config.input.keyEvents) {
                allowHold = true;
                lastKeyCount = Config.input.keyEvents;
                switch(Config.input.lastKey) {
                    case 13: // Enter
                        THIS.openPopupWindow(texture);
                        break;

                    case 65: // A
                        heightMap.setHighlightRange(0, heightMap.getMapLength());
                        break;

                    case 67: // C
                        THIS.copyPixel(texture);
                        break;

                    case 70: // F
                        THIS.flipPixels(texture);
                        break;

                    case 46: // DEL
                    case 68: // D
                        THIS.setPixel(texture, [0, 0, 0, 0]);
                        break;

                    case 45: // INS
                    case 86: // V
                        THIS.pasteEditorPixel(texture);
                        break;

                    case 83: // S
                        THIS.commitTextureData(texture);
                        break;


                    case 48: THIS.printHeightPattern(texture, patternLinear);    break;  // 0
                    case 49: THIS.printHeightPattern(texture, patternFlip);      break;  // 1
                    case 50: // 2
                    case 51: // 3
                    case 52: // 4
                    case 53: // 5
                    case 54: // 6
                    case 55: // 7
                    case 56: // 8
                    case 57: // 9
                        THIS.printHeightPattern(texture);
                        break;

                    default:
                    // console.log("Key Change", shift, Config.input.lastKey);
                }
            }

            // Hold-down keys

            if(allowHold) {
                if(ctrl && alt) V = 16;
                if (PK[39]) THIS.moveSelection(V - shift, shift);   // Right
                if (PK[37]) THIS.moveSelection(shift - V, -shift);  // Left
                if (PK[40]) THIS.changeHeightPixel(texture, -0.01);        // Down
                if (PK[38]) THIS.changeHeightPixel(texture, 0.01);         // Up

                if (PK[82]) THIS.changePixel(texture, [shift ? -V : V, 0, 0, 0]);  // R
                if (PK[71]) THIS.changePixel(texture, [0, shift ? -V : V, 0, 0]);  // G
                if (PK[66]) THIS.changePixel(texture, [0, 0, shift ? -V : V, 0]);  // B
            }
        };

        function loadImageData(image) {
            if(image.imageDataCache)
                return image.imageDataCache;
            var canvas = document.createElement('canvas');
            var mapContext = canvas.getContext('2d');
            mapContext.drawImage(image, 0, 0);
            var imageData = mapContext.getImageData(0, 0, image.width, image.height);
            image.imageDataCache = imageData;
            return imageData;
        }

        this.setPixel = function(texture, pixelData) {
            var image = texture.srcImage,
                imageData = loadImageData(image);

            var pos = 0, range = heightMap.getHighlightRange();
            for (var i=range[0]; i<range[1]; i++) {
                var offset = i*4;
                imageData.data[offset + 0] = pixelData[pos + 0];
                imageData.data[offset + 1] = pixelData[pos + 1];
                imageData.data[offset + 2] = pixelData[pos + 2];
                imageData.data[offset + 3] = pixelData[pos + 3];
                pos += 4;
                if(pos >= pixelData.length)
                    pos = 0;
            }

            heightMap.updateHeightMapTexture(texture, imageData);
            // TODO: save
        };

        this.changeHeightPixel = function (texture, heightData) {
            var image = texture.srcImage,
                imageData = loadImageData(image);

            if(!Array.isArray(heightData)) heightData = [heightData];

            var pos = 0, range = heightMap.getHighlightRange();
            for (var i=range[0]; i<range[1]; i++) {
                var offset = i*4;
                var oldPixel = imageData.data.slice(offset, offset+4);
                var height = oldPixel[0]/256 + oldPixel[1]/(256*256) + oldPixel[2]/(256*256*256);
                height += heightData[pos];
//                 var offset = (Math.floor(i/image.width)*image.width + (i%image.width)) * 4;
                imageData.data[offset + 0] = Math.floor(height * (256));
                imageData.data[offset + 1] = Math.floor((height * (256*256)) % 256);
                imageData.data[offset + 2] = Math.floor((height * (256*256*256)) % (256));
                // imageData.data[offset + 3] = 0; // (height % (256*256*256*256))/(256*256*256);
                pos ++;
                if(pos >= heightData.length)
                    pos = 0;
            }

            heightMap.updateHeightMapTexture(texture, imageData);
            console.log("Change Pixel Height: ",  imageData.data.slice(range[0]*4, range[1]*4));

        };

        this.changePixel = function(texture, pixelData) {
            var image = texture.srcImage,
                imageData = loadImageData(image);

            var pos = 0, range = heightMap.getHighlightRange();
            for (var i=range[0]; i<range[1]; i++) {
                var offset = i*4;
//                 var offset = (Math.floor(i/image.width)*image.width + (i%image.width)) * 4;
                imageData.data[offset + 0] += pixelData[pos + 0];
                imageData.data[offset + 1] += pixelData[pos + 1];
                imageData.data[offset + 2] += pixelData[pos + 2];
                // imageData.data[offset + 3] += pixelData[pos + 3];
                pos += 4;
                if(pos >= pixelData.length)
                    pos = 0;
            }

            heightMap.updateHeightMapTexture(texture, imageData);
            console.log("Change Pixel: ",  imageData.data.slice(offset, offset+4));
            // TODO: save
        };

        this.flipPixels = function(texture) {
            var image = texture.srcImage,
                imageData = loadImageData(image);

            var flippedData = imageData.data.slice();
            var range = heightMap.getHighlightRange();
            for (var i=range[0]; i<range[1]; i++) {
                var offset = i*4;
                var foffset = (range[1]-(i-range[0]))*4;
//                 var offset = (Math.floor(i/image.width)*image.width + (i%image.width)) * 4;
                imageData.data[offset + 0] = flippedData[foffset + 0];
                imageData.data[offset + 1] = flippedData[foffset + 1];
                imageData.data[offset + 2] = flippedData[foffset + 2];
                // imageData.data[offset + 3] = flippedData[foffset + 3];
            }

            imageData.data = flippedData;
            heightMap.updateHeightMapTexture(texture, imageData);
            console.log("Flipped Pixels: ",  range);
            // TODO: save
        };

        var pixelCache;
        this.copyPixel = function(texture) {
            var image = texture.srcImage;
            var imageData = loadImageData(image);
            var range = heightMap.getHighlightRange();
            var aRange = [range[0] * 4, range[1] * 4];

            pixelCache = new Uint8ClampedArray((range[1]-range[0])*4);

            var pos = 0;
            for (var i=aRange[0]; i<aRange[1]; i++)
                pixelCache[pos++] = imageData.data[i];

            console.log("Copied: ", pixelCache);
        };

        this.pasteEditorPixel = function() {
            if(!pixelCache)
                throw new Error("No pixel cache");

            var shift = Config.input.pressedKeys[keyConstants.CHAR_SHIFT];

            var range = heightMap.getHighlightRange();
            var pastePixels = pixelCache;
            var pasteLength = (range[1]-range[0]);
            if(pixelCache.length !== pasteLength*4 && !shift) {
                pastePixels = new Uint8ClampedArray(pasteLength*4);
                var ratio = pixelCache.length / (pasteLength*4);
                for (var i=0; i<pasteLength; i++) {
                    var offset = i*4;
                    var pos = i * ratio;
                    var leftPos = Math.floor(pos);
                    var rightPos = Math.ceil(pos);
                    var leftPerc = 0.5, rightPerc = 0.5;
                    if(rightPos === pixelCache.length/4) rightPos--;
                    if(leftPos !== rightPos) {
                        leftPerc = 1-(pos - leftPos);
                        rightPerc = 1-(rightPos - pos);
                    }
                    pastePixels[offset + 0] = (pixelCache[leftPos*4 + 0]*leftPerc + pixelCache[rightPos*4 + 0]*rightPerc);
                    pastePixels[offset + 1] = (pixelCache[leftPos*4 + 1]*leftPerc + pixelCache[rightPos*4 + 1]*rightPerc);
                    pastePixels[offset + 2] = (pixelCache[leftPos*4 + 2]*leftPerc + pixelCache[rightPos*4 + 2]*rightPerc);
                    pastePixels[offset + 3] = (pixelCache[leftPos*4 + 3]*leftPerc + pixelCache[rightPos*4 + 3]*rightPerc);
                }
            }


            this.setPixel(pastePixels);
        };

        this.moveSelection = function(vStart, vLength) {
            var range = heightMap.getHighlightRange();
            range[0] += vStart;
            range[1] += vStart + vLength;
            heightMap.setHighlightRange(range[0], range[1]);
            // console.log("Range: ",  heightMap.getHighlightRange(), vStart, vLength);
        };

        // Save

        this.commitTextureData = function(texture) {
            var image = texture.srcImage,
                imageData = loadImageData(image);

            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            var mapContext = canvas.getContext('2d');
            // mapContext.drawImage(imageData, 0, 0);
            mapContext.putImageData(imageData, 0, 0);
                
            var data = canvas.toDataURL();

            var POST = {
                "action": "asset-save-png",
                "path": image.srcRelative,
                "data": data,
                // "left": 0,
                // "top": 0,
                "width": image.width,
                "height": image.height
            };
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if(this.status !== 200)
                        throw new Error(this.responseText);
                    var json = JSON.parse(this.responseText);
                    console.log(json);
                }
            };

            var filePath = Config.path.root + '/client/game1.interface.php';
            xhttp.open("POST", filePath, true);
            xhttp.setRequestHeader('Content-type', 'application/json');
            xhttp.send(JSON.stringify(POST));

            console.info("Saving texture data: ", filePath);
        };



        // Print

        this.printHeightPattern = function(texture, pattern) {
            var image = texture.srcImage,
                imageData = loadImageData(image);

            pattern = pattern || patternLinear;

            var range = heightMap.getHighlightRange();
            var e = {
                firstPixel: imageData.data.slice(range[0]*4, range[0]*4+4),
                lastPixel: imageData.data.slice(range[1]*4, range[1]*4+4),
                image: image,
                imageData: imageData,
                range: range
            };
            e.firstHeight = e.firstPixel[0]/256 + e.firstPixel[1]/(256*256) + e.firstPixel[2]/(256*256*256);
            e.lastHeight = e.lastPixel[0]/256 + e.lastPixel[1]/(256*256) + e.lastPixel[2]/(256*256*256);

            for (var pos=range[0]; pos<range[1]; pos++) {
                var offset = pos * 4;
                var oldPixel = imageData.data.slice(offset, offset+4);
                var height = oldPixel[0]/256 + oldPixel[1]/(256*256) + oldPixel[2]/(256*256*256);
                e.pos = pos;
                var newHeight = pattern(e, height);
                imageData.data[offset + 0] = Math.floor(newHeight * (256));
                imageData.data[offset + 1] = Math.floor((newHeight * (256*256)) % 256);
                imageData.data[offset + 2] = Math.floor((newHeight * (256*256*256)) % (256));
                // imageData.data[offset + 3] = newPixel[3];
            }

            heightMap.updateHeightMapTexture(texture, imageData);
            // TODO: save
        };


        // Print patterns

        function patternFlip(e, height) {
//             console.log("Height: ", height, 1 - height);
            return 1 - height;
        }

        function patternLinear(e, height) {
            var diff = e.lastHeight - e.firstHeight;
            var percent = (e.pos - e.range[0]) / (e.range[1] - e.range[0]);
            var newHeight = e.firstHeight + diff * percent;
//             console.log("Linear: ", diff, percent, newHeight);
            return newHeight;
        }

        function patternCurveDown(e, oldPixel) {
            var mid = (e.range[1] - e.range[0]) / 2;
            oldPixel[3] = e.firstPixel[3]
        }

        // Popup window

        this.openPopupWindow = function(texture) {
            var ROOT = Config.path.root;

            var image = texture.srcImage,
                title = "Edit Heightmap: " + texture.srcImage.srcRelative;

            var popup = window.open(ROOT + 'fragment/editor/heightmap.html', "editor_heightmap", "titlebar=1&scrollbars=1&resizable=1", true);
            popup.loadHeightMapEditor = function(e) {
                console.log(e, popup.document.body);
            }

        }
    }
})();