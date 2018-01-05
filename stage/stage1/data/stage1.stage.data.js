"use strict";
(function() {
    var Util = ForgottenFuture.Util;
        
    ForgottenFuture.Stage.Stage1.initData = initData;

    var deps = [
        // Camera/ViewPort
        'render/viewport/simple.viewport.js',

        // Level Maps
        'render/shader/tilemap.shader.js',
        'render/shader/heightmap.shader.js',
        'render/generator/render.generator.js',
    
        // Sprites
        'sprite/character/lem/lem.sprite.js',
        'sprite/vehicle/RAV/RAV.sprite.js',
    ];
    Util.loadScript(deps);

    function initData(gl, stage, callback) {

        // Players
        var Lem = new ForgottenFuture.Sprite.Character.Lem(gl, stage);
        var RAV1 = new ForgottenFuture.Sprite.Vehicle.RAV(gl, stage);

        // Level Sprites
        var mapGen = new ForgottenFuture.Render.Generator();
        // var pfMain = new ForgottenFuture.Render.Shader.TileMap(gl, this, DIR_LEVEL_MAP, DIR_TILE_SHEET, 64);
        // var hmMain = new ForgottenFuture.Render.Shader.HeightMap(gl, this, 2048, DIR_HEIGHT_MAP);
        var aData0 = mapGen.genSinWaveHeightMap();

        var hmMain = new ForgottenFuture.Render.Shader.HeightMap(gl, aData0);
//             .setHeightMap(iHMapMain, 0.2, 10)
//             .setColor();

        var renderList = [
            hmMain, Lem, RAV1 // , pfMain
        ];
        var hitboxList = [
            //pfMain,
            hmMain
        ];
        // RAV1.setRotate([0, 0, 1]);
        RAV1.setPosition([7, 8, 0]);

        Lem.setPosition([10, 10, 0]);
        stage.setViewPort(Lem .getViewPort());

        // Extras
        var Lems = [];
        for(var li=0;li<20;li++) {
            Lems[li] = new ForgottenFuture.Sprite.Character.Lem(gl, this);
            Lems[li].setPosition([10, 10, 0]);
            // Lems[li].setVelocity([0.1 * Math.random(), 0, 0]);
            renderList.unshift(Lems[li]);
        }

        // Lem.setScale(0.5);
        callback(renderList, hitboxList);
    }

})();