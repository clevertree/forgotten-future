/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    var TileMap = Config.fragment.TileMap;
    // var PIXELS_PER_UNIT = Config.constants.PIXELS_PER_UNIT;

    var CHAR_SHIFT = 16;
    var lastKeyCount = 0;
    var lastHoldTime = 0, lastHoldDelay = 200;
    TileMap.prototype.updateEditor = function (t, stage, flags) {
        if(!this instanceof TileMap)
            throw new Error("Invalid Tile Map: ", this);
        if(typeof this.editor === 'undefined') {
            this.editor = {
                range: [0, 0, 1, 1]
            }
        }

        var PK = Config.input.pressedKeys;
        var noShift = Config.input.pressedKeys[CHAR_SHIFT] ? 0 : 1;

        // Hold-down keys
        if(PK[37] || PK[38] || PK[39] || PK[40]) {
            if(t > lastHoldTime) {
                if (PK[39]) this.moveEditorSelection(noShift, 0, 1, 0);     // Right
                if (PK[37]) this.moveEditorSelection(-noShift, 0, -1, 0);   // Left
                if (PK[40]) this.moveEditorSelection(0, noShift, 0, 1);     // Down
                if (PK[38]) this.moveEditorSelection(0, -noShift, 0, -1);   // Up
                lastHoldTime = t + lastHoldDelay;
                if(lastHoldDelay > 20)
                    lastHoldDelay-=20;
            }
        } else {
            lastHoldTime = t;
            lastHoldDelay=200;
        }


        // Press-once keys
        if(lastKeyCount < Config.input.keyEvents) {
            lastKeyCount = Config.input.keyEvents;
            switch(Config.input.lastKey) {
                case 65: // A
                    this.setEditorSelection(0, 0, 99999999, 99999999);
                    break;

                case 78: // N:
                    this.changeEditorNextPixel();
                    break;

                case 76: // L
                    this.changeEditorLastPixel();
                    break;


                case 67: // C
                    this.copyEditorPixel();
                    break;

                case 46: // DEL
                case 68: // D
                    this.changeEditorPixel([0, 0, 0, 0]);
                    break;

                case 45: // INS
                case 86: // V
                    this.pasteEditorPixel();
                    break;

                case 83: // S
                    this.saveEditorMap();
                    break;

                case 84: // T
                    this.printHeightPattern();
                    break;


                default:
//                     console.log("Key Change", noShift, Config.input.lastKey);
            }
        }
    };


    TileMap.prototype.moveEditorSelection = function(vx, vy, vw, vh) {
        var range = this.editor.range;
        range[0] += vx;
        range[1] += vy;
        range[2] += vw;
        range[3] += vh;
        this.editor.range = this.setEditorSelection(range[0], range[1], range[2], range[3]);
        // console.log("Pixel: ", vActiveColorRange[0], vActiveColorRange[1], getPixel(vActiveColorRange[0], vActiveColorRange[1], 0));
    };


    TileMap.prototype.changeEditorNextPixel = function() {
        var toPixel = this.getTilePixel(this.editor.range[0], this.editor.range[1]);
        // Next Pixel in the row
        toPixel[0]++;
        if(toPixel[0]>255) {
            toPixel[0] = 0;
            toPixel[1]++;
            if(toPixel[1] > 255)
                toPixel[1] = 0;
        }
        toPixel[2]=255;
        this.changeEditorPixel(toPixel);
    };

    TileMap.prototype.changeEditorLastPixel = function() {
        var toPixel = this.getTilePixel(this.editor.range[0], this.editor.range[1]);
        // Next Pixel in the row
        toPixel[0]--;
        if(toPixel[0]<0) {
            toPixel[0] = 255;
            toPixel[1]--;
            if(toPixel[1] < 0)
                toPixel[1] = 255;
        }
        toPixel[2]=255;
        this.changeEditorPixel(toPixel);
    };

    var pixelCache;
    TileMap.prototype.copyEditorPixel = function() {
        var range = this.editor.range;
        var w = (range[2] - range[0]);
        var h = (range[3] - range[1]);
        pixelCache = new ImageData(w, h);
        var i = 0;
        for(var y=range[1]; y<range[3]; y++) {
            for(var x=range[0]; x<range[2]; x++) {
                var pixel = this.getTilePixel(x, y);
                pixelCache.data[i++] = pixel[0];
                pixelCache.data[i++] = pixel[1];
                pixelCache.data[i++] = pixel[2];
                pixelCache.data[i++] = pixel[3];
            }
        }
        console.log("Copied: ", pixelCache);
    };

    TileMap.prototype.pasteEditorPixel = function() {
        if(!pixelCache)
            throw new Error("No pixel cache");

        this.changeEditorPixel(pixelCache.data); // TODO: is this right? set range?
    };


    TileMap.prototype.printHeightPattern = function() {
        var range = this.editor.range;
        var left = range[0];
        var top = range[1];
        var w = (range[2] - range[0]);
        var h = (range[3] - range[1]);
        var data = new Uint8Array(w*h*4);
        var i = 0;
        for(var y=0; y<h; y++) {
            for(var x=0; x<w; x++) {
                data[i+0] = x;
                data[i+1] = y;
                data[i+2] = 255;
                i+=4;
            }
        }
        this.changeEditorPixel(data);
    };

})();
