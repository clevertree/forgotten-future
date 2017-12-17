/**
 * Created by Ari on 12/30/2016.
 */

// Set up script-side listeners

(function() {
    var Util            = ForgottenFuture.Util,
        Flag            = ForgottenFuture.Constant,
        pressedKeys     = ForgottenFuture.Input.pressedKeys;

    var DIR = 'sprite/vehicle/RAV/';
    var DIR_SPRITESHEET = DIR + 'RAV.spritesheet.png';

    Util.loadScript('render/shader/sprite.shader.js');


    ForgottenFuture.Sprite.Vehicle.RAV = RAV;
    function RAV(gl, stage) {

        // Sprite Sheet
        this.sprite = new ForgottenFuture.Render.Shader.SpriteSheet2(gl, DIR_SPRITESHEET);

        // Rendering
        this.render = function(t, gl, flags) {
            this.sprite.render(t, gl, stage.viewPort.getProjection(), flags);
        };

        var CHAR_SHIFT = 16;
        this.update = function(t, flags) {
            this.sprite.update(t, flags);

            // Controls
            // if(pressedKeys[39] || pressedKeys[68])  mAcceleration = [speed, 0, 0];  // Right:
            // if(pressedKeys[37] || pressedKeys[65])  mAcceleration = [-speed, 0, 0];  // Left:
            // if(pressedKeys[40] || pressedKeys[83])  mAcceleration = [0, -speed, 0];  // Down:
            // if(pressedKeys[38] || pressedKeys[87])  mAcceleration = [0, speed, 0];  // Up:
            // if(pressedKeys[71])                     mAcceleration = stage.mGravity;  // Up:

            // Collision
            // var hitFloor = stage.testHit(mPosition[0], mPosition[1], mPosition[2]);
            // if(!hitFloor) {
            //     // Fall
            //     if(!mAcceleration) {
            //         mAcceleration = stage.mGravity;
            //         if(!mVelocity) mVelocity = [0, 0, 0];
            //     }
            //
            // } else {
            //     // Standing
            //     if(mVelocity) // Collision
            //         handleStageCollision(t, stage, flags);
            // }
        };

        function handleStageCollision(t, stage, flags) {
            mAcceleration = null;
            // mVelocity = null;

            if(!mVelocity) mVelocity = [0, 0, 0];
            mVelocity = [mVelocity[0], Math.abs(mVelocity[1] * 0.98), mVelocity[2]];
        }

    }

})();