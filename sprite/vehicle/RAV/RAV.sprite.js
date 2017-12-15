/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var Util = ForgottenFuture.Util;

    var DIR = 'sprite/vehicle/RAV/';
    var DIR_SPRITESHEET = DIR + 'RAV.spritesheet.png';

    Util.loadScript('sprite/fragment/sprite.fragment.js');

    var editor = null;
    var pressedKeys = Input.pressedKeys;

    ForgottenFuture.Sprite.Vehicle.RAV = RAV;
    function RAV(gl, stage) {

        // Sprite Sheet
        this.sprite = new ForgottenFuture.Sprite.Fragment.Sprite(gl, DIR_SPRITESHEET);

        // Rendering
        this.render = function(t, gl, flags) {
            this.sprite.render(t, gl, stage.mProjection, flags);
        };

        var CHAR_SHIFT = 16;
        this.update = function(t, flags) {
            if(flags & Flags.RENDER_SELECTED) {
                if(!editor)
                    editor = new Config.script.controller.Editor();
                editor.update(this, t, flags);
                return;
            }

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