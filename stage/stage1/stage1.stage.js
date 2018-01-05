"use strict";
/**
 * Created by ari on 5/14/2017.
 */

// Set up script-side listeners

(function() {
    var Util = ForgottenFuture.Util,
        Constant = ForgottenFuture.Constant,
        Render = ForgottenFuture.Render,
        Input = ForgottenFuture.Input;

    Util.loadScript('stage/stage.prototype.js');

    // Stage Data
    Util.loadScript('stage/stage1/data/stage1.stage.data.js');

    ForgottenFuture.Stage.Stage1 = Stage1;

    /**
     * @param {WebGLRenderingContext} gl
     * @constructor
     */
    function Stage1(gl) {
        console.log(this);
    }

    Stage1.prototype = Object.create(ForgottenFuture.Stage.StagePrototype.prototype, {});
    Stage1.prototype.constructor = Stage1;

        // varB: {
        //     value: null,
        //     enumerable: true,
        //     configurable: true,
        //     writable: true
        // },
        // doSomething: {
        //     value: function() { // override
        //         A.prototype.doSomething.apply(this, arguments); // call super
        //         ...
            // },
            // enumerable: true,
            // configurable: true,
            // writable: true
        // }


})();