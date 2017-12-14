/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    var ROOT = Config.path.root;
    var SPRITE_RESOLUTION = 128;
    var DIR_CHARACTER = ROOT + 'sprite/';
        var DIR_SHEET = DIR_CHARACTER + 'sheet/lem/lem-default.'+SPRITE_RESOLUTION+'.sprite-sheet.png';
    Config.sprite.character.Player1 = Player1;
    var PIXELS_PER_UNIT = Config.constants.PIXELS_PER_UNIT;

    Config.util.loadScript('game/fragment/spritesheet.fragment.js');

    function Player1(gl, stage) {
        var THIS = this;
        var Fragment = Config.fragment;

        // Local Variables
        var speed = 1/10000;
        var input = Config.input;
        var mPosition = [0, 0, 0];
        var mVelocity = [0.1 * Math.random(), 0, 0];
        var mAcceleration = null;
        // var scale = 1;

        // Sprite Sheet
        var fSpriteSheet = new Fragment.SpriteSheet(gl, stage, DIR_SHEET, SPRITE_RESOLUTION, (1/16 * 1000));
        // setScale(scale);
        // move(0, 12, 0);


        /**
         * Render Sprite
         * @param t time elapsed
         * @param gl WebGL Instance
         * @param stage
         * @param flags
         */
        this.render = function(t, flags) {
            fSpriteSheet.render(t, flags);
        };

        /**
         * Update Sprite Logic
         * @param t
         * @param stage
         * @param flags
         */
        this.update = function(t, flags) {
            if(flags & Config.flags.RENDER_SELECTED) {
                updateEditor(t, flags);
            } else {
                updateMotion(t, flags);
            }
        };

        this.move = function(mDistance) {
            mPosition[0] += mDistance[0];
            mPosition[1] += mDistance[1];
            mPosition[2] += mDistance[2];
            fSpriteSheet.move(mDistance);
        };

        this.setScale = function(newScale) {
            fSpriteSheet.setScale(newScale);
        };

        this.setAcceleration = function (mNewAcceleration) {
            mAcceleration = mNewAcceleration;
            if(!mVelocity) mVelocity = [0, 0, 0];
        };

        // Physics

        var CHAR_SHIFT = 16;
        function updateMotion(t, flags) {
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
                    handleStageCollision(t, flags);
            }
        }

        function handleStageCollision(t, flags) {
            mAcceleration = null;
            // mVelocity = null;

            if(!mVelocity) mVelocity = [0, 0, 0];
            mVelocity = [mVelocity[0], Math.abs(mVelocity[1] * 0.98), mVelocity[2]];
        }

        // Editor

        function updateEditor(t, flags) {
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