/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var Config = window.games.game1;
    var DIR = Config.path.root + 'sprite/vehicle/RAV/';
    var DIR_SPRITESHEET = DIR + 'RAV.spritesheet.png';
    Config.sprite.vehicle.RAV = RAV;

    function RAV(gl, input, mPosition, mVelocity, mAcceleration) {
        var THIS = this;
        var Fragment = Config.fragment;

        // Local Variables
        var speed = 1/10000;
        input = input || Config.input;
        mPosition = mPosition || [0, 0, 0];
        mVelocity = mVelocity || [0.1 * Math.random(), 0, 0];
        mAcceleration = mAcceleration || null;
        var scale = 1;
        var rotation = 0;

        // Sprite Sheet
        this.sprite = new Fragment.Sprite(gl, DIR_SPRITESHEET);
        this.sprite.setScale(5, 2);
        this.sprite.rotate(0, 0, -0.1);
        // move(0, 12, 0);

        this.render = function(t, gl, stage, flags) {
            this.sprite.render(t, gl, stage, flags);
        };

        this.update = function(t, stage, flags) {
            if(flags & Config.flags.RENDER_SELECTED) {
                updateEditor(t, stage, flags);
            } else {
                updateMotion(t, stage, flags);
            }
        };

        this.move = function(mDistance) {
            mPosition[0] += mDistance[0];
            mPosition[1] += mDistance[1];
            mPosition[2] += mDistance[2];
            this.sprite.move(mDistance);
        };

        this.setScale = function(newScale) {
            scale = newScale;
            this.sprite.setScale(newScale);
        };

        this.setAcceleration = function (mNewAcceleration) {
            mAcceleration = mNewAcceleration;
            if(!mVelocity) mVelocity = [0, 0, 0];
        };

        // Physics

        var CHAR_SHIFT = 16;
        function updateMotion(t, stage, flags) {
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

        // Editor

        function updateEditor(t, stage, flags) {
            var pressedKeys = input.pressedKeys;
            if(pressedKeys[39])     THIS.move([0.1,  0.0,  0.0]);  // Right:
            if(pressedKeys[37])     THIS.move([-0.1, 0.0,  0.0]);  // Left:
            if(pressedKeys[40])     THIS.move([0.0, -0.1,  0.0]);  // Down:
            if(pressedKeys[38])     THIS.move([0.0,  0.1,  0.0]);  // Up:
            if(pressedKeys[34])     THIS.move([0.0,  0.0, -0.1]);  // Page Down:
            if(pressedKeys[33])     THIS.move([0.0,  0.0,  0.1]);  // Page Up:
                // stage.testHit(mPosition[0], mPosition[1], mPosition[2]);
        }
    }

})();