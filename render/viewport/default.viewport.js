/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Util = ForgottenFuture.Util;
    
    ForgottenFuture.Render.ViewPort = ViewPort;
    function ViewPort(gl) {
        var THIS = this;
        var vScale = [1, 1, 1];
        var viewRatio = 1;

        var mProjection = DEFAULT_PROEJCTION;

        var vPosition = [0, 0, 0], vVelocity = null, vAcceleration = null, vRotation = null;

        // Functions
        
        this.update = function(t, flags) {

            // Acceleration
            if(vAcceleration) {
                if(!vVelocity) vVelocity = [0, 0, 0];
                vVelocity[0] += vAcceleration[0];
                vVelocity[1] += vAcceleration[1];
                vVelocity[2] += vAcceleration[2];
            }

            if(vVelocity) {
                vPosition[0] += vVelocity[0];
                vPosition[1] += vVelocity[1];
                vPosition[2] += vVelocity[2];
            }

            mProjection = Util.translate(DEFAULT_PROEJCTION, vPosition[0] - vScale[0]/2, vPosition[1] - vScale[1]/2, vPosition[2]);
            if(vRotation) {
                if(vRotation[0]) mProjection = Util.xRotate(mProjection, vRotation[0]);
                if(vRotation[1]) mProjection = Util.yRotate(mProjection, vRotation[1]);
                if(vRotation[2]) mProjection = Util.zRotate(mProjection, vRotation[2]);
            }
            mProjection = Util.translate(mProjection,  -vScale[0]/2, - vScale[1]/2, 0);

        };

        this.getProjection = function () {
            return mProjection;
        };


        this.setScale = function(newScale) {
            vScale = [newScale, newScale * viewRatio, 0];
        };

        this.getVelocity = function() { return vVelocity; };
        this.setVelocity = function(vx, vy, vz) {
            vVelocity = [vx, vy, vz];
        };

        this.getAcceleration = function() { return vAcceleration; };
        this.setAcceleration = function(ax, ay, az) {
            if(!vVelocity)
                this.setVelocity(0,0,0);
            vAcceleration = [ax, ay, az];
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
    var DEFAULT_PROEJCTION = [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, -3, -4, -3, 0, 10];

    var defaultModelViewMatrix = Util.translation(0,0,0); //[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];


})();

