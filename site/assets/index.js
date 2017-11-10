
if(urlParams.autoplay) {
    console.info("Autoplay running");
    relay('INCLUDE game/loader.js');
    relay('PLAY');
}



// relay('RENDER <pre class="text-div">Hello World<hr/></pre>');
// relay('RENDER.SELECTOR .text-div Hi World<hr/>');
//
// setTimeout(function () {
//
//     // Launch Game
//     relay('INCLUDE game/loader.js');
//     relay('PLAY');
//
// } ,10000);
//
// // Play music and movies
// //            relay('PLAY tests/files/music/song1.js');
// //            relay('QUEUE mymovies/myfirstmovie');
//
//
// // Launch Chat room windows
// //            relay('CHAT mychannel');             // GET ~/mychannel => GET /home/ABCD1234/mychannel
// //            relay('CHAT /common');
//
//
// // Open Browser with home page
// //            relay('GET');                       // GET ~/ => GET /home/ABCD1234/
//
//
//
