/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var Util = ForgottenFuture.Util, Input = ForgottenFuture.Input;
    // ForgottenFuture.Script.Controller.Editor = Editor;

    function Editor() {


        // Editor

        this.update = function(sprite, t, flags) {
            var pressedKeys = Input.pressedKeys;
            if(pressedKeys[39])     THIS.move([0.1,  0.0,  0.0]);  // Right:
            if(pressedKeys[37])     THIS.move([-0.1, 0.0,  0.0]);  // Left:
            if(pressedKeys[40])     THIS.move([0.0, -0.1,  0.0]);  // Down:
            if(pressedKeys[38])     THIS.move([0.0,  0.1,  0.0]);  // Up:
            if(pressedKeys[34])     THIS.move([0.0,  0.0, -0.1]);  // Page Down:
            if(pressedKeys[33])     THIS.move([0.0,  0.0,  0.1]);  // Page Up:
        };
    }

})();