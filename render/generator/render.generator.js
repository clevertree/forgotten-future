"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        Render = ForgottenFuture.Render;


    Render.Generator = Generator;
    function Generator() {

        this.genSinWaveHeightMap = function() {
            var aData0 = new Float32Array(2048);
            for(var ii=0;ii<2048;ii++) {
                aData0[ii] = Math.abs(Math.sin(ii / 100) * (0.9 + Math.random()/20) * 400 * (ii/10000));
            }
            return aData0;
        }
    }


})();


