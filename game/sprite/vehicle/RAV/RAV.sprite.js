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

        // Physics
        this.physics = new Config.script.physics.Vehicle(this, stage);

        // Rendering
        this.render = function(t, gl, flags) {
            this.physics.update(t, flags);
            this.sprite.render(t, gl, flags);
        };

    }

})();