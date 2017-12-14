/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var Config = window.games.game1;
    var DIR = Config.path.root + 'sprite/vehicle/RAV/';
    var DIR_SPRITESHEET = DIR + 'RAV.spritesheet.png';
    Config.sprite.vehicle.RAV = RAV;

    Config.util.loadScript('game/fragment/sprite.fragment.js');


    function RAV(gl, stage) {

        // Sprite Sheet
        this.sprite = new Config.fragment.Sprite(gl, DIR_SPRITESHEET);

        // Rendering
        this.render = function(t, gl, flags) {
            update(t, flags);
            this.sprite.render(t, gl, flags);
        };

        var CHAR_SHIFT = 16;
        function update(t, flags) {
            if(flags & Config.flags.RENDER_SELECTED) {
                if(!Editor)
                    Editor = new Config.script.controller.Editor(sprite);
                Editor.update(sprite, t, flags);
                return;
            }

            var pressedKeys = input.pressedKeys;

            // Controls
            // if(pressedKeys[39] || pressedKeys[68])  mAcceleration = [speed, 0, 0];  // Right:
            // if(pressedKeys[37] || pressedKeys[65])  mAcceleration = [-speed, 0, 0];  // Left:
            // if(pressedKeys[40] || pressedKeys[83])  mAcceleration = [0, -speed, 0];  // Down:
            // if(pressedKeys[38] || pressedKeys[87])  mAcceleration = [0, speed, 0];  // Up:
            // if(pressedKeys[71])                     mAcceleration = stage.mGravity;  // Up:

            // Acceleration
            if(mAcceleration) {
                if(!mVelocity) mVelocity = [0, 0, 0];
                mVelocity[0] += mAcceleration[0];
                mVelocity[1] += mAcceleration[1];
                mVelocity[2] += mAcceleration[2];
            }

            // Position
            if(mVelocity)
                THIS.move(mVelocity);

            // Collision
            var hitFloor = stage.testHit(mPosition[0], mPosition[1], mPosition[2]);
            if(!hitFloor) {
                // Fall
                if(!mAcceleration) {
                    mAcceleration = stage.mGravity;
                    if(!mVelocity) mVelocity = [0, 0, 0];
                }

            } else {
                // Standing
                if(mVelocity) // Collision
                    handleStageCollision(t, stage, flags);
            }
        }

        function handleStageCollision(t, stage, flags) {
            mAcceleration = null;
            // mVelocity = null;

            if(!mVelocity) mVelocity = [0, 0, 0];
            mVelocity = [mVelocity[0], Math.abs(mVelocity[1] * 0.98), mVelocity[2]];
        }

    }

})();