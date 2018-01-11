"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        Render = ForgottenFuture.Render;


    Render.Generator = Generator;
    function Generator() {

        this.genSinWaveHeightMap = function(mapLength) {
            mapLength = mapLength || 2048;
            var aData0 = new Float32Array(mapLength);
            for(var ii=0;ii<mapLength;ii++) {
                aData0[ii] = Math.abs(Math.sin(ii / 20) * (0.9 + Math.random()/20) * 1400 * (ii/10000));
            }
            return aData0;
        }
    }


})();


