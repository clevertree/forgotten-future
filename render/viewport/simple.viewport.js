"use strict";
/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util,
        Render = ForgottenFuture.Render;
    
    ForgottenFuture.Render.ViewPort.SimpleViewPort = SimpleViewPort;
    function SimpleViewPort(script, vPosition, vVelocity, vRotation) {
        script = script || function() {};
        vPosition = vPosition || [0, 0, 0];
        // Functions
        this.calculateProjection = function(t) {
            // Calculate projection

            // Aspect Ratio
            var mProjection = DEFAULT_PROJECTION;
            if(Render.widthToHeightRatio < 1) {
                mProjection = Util.scale(mProjection, 1, Render.widthToHeightRatio, 1);
            } else {
                mProjection = Util.scale(mProjection, 1/Render.widthToHeightRatio, 1, 1);
            }

            // Velocity
            if(vVelocity) {
                vPosition[0] += vVelocity[0];
                vPosition[1] += vVelocity[1];
                vPosition[2] += vVelocity[2];
            }

            script(vPosition, vVelocity, vRotation);

            // Translation
            if(vPosition) {
                mProjection = Util.translate(mProjection, vPosition[0], vPosition[1], vPosition[2]);
            }

            // Rotation
            if(vRotation) {
                if(vRotation[0]) mProjection = Util.xRotate(mProjection, vRotation[0]);
                if(vRotation[1]) mProjection = Util.yRotate(mProjection, vRotation[1]);
                if(vRotation[2]) mProjection = Util.zRotate(mProjection, vRotation[2]);
            }

            return mProjection;
        };

        this.getVelocity = function() { return vVelocity; };
        this.setVelocity = function(vx, vy, vz) {
            vVelocity = [vx, vy, vz];
        };

        this.getPosition = function () { return vPosition; };
        this.setPosition = function(x, y, z) {
            vPosition = [x, y, z];
        };

        this.getRotate = function () { return vRotation; };
        this.setRotate = function(aX, aY, aZ) {
            vRotation = [aX, aY, aZ];
        };
    }

    // Static

    // Default FOV
    var DEFAULT_PROJECTION = [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, -3, -4, -3, 0, 10];


})();

