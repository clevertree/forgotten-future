"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        Render = ForgottenFuture.Render;


    Render.Generator = Generator;
    function Generator() {

    }

    Generator.prototype.genSinWaveHeightMap = function(mapLength) {
        mapLength = mapLength || 2048;
        var heightData = new Float32Array(mapLength);
        for(var ii=0;ii<mapLength;ii++) {
            heightData[ii] = Math.abs(Math.sin(ii / 20) * (0.9 + Math.random()/20) * 1400 * (ii/10000));
        }
        return heightData;
    };


    Generator.prototype.genSinWaveGridMap2D = function(mapLength) {
        mapLength = mapLength || 2048;
        var gridData = []; // new Float32Array(mapLength);
        for(var ii=0;ii<mapLength;ii++) {
            gridData[ii] = [
                ii*0.9,
                Math.abs(Math.sin(ii / 20) * (0.9 + Math.random()/20) * 1400 * (ii/10000))
            ];
        }
        return gridData;
    };


})();


