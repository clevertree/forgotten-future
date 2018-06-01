

(function() {
    document.addEventListener('song:load', onLoad);

    function onLoad(e) {
        var manager = new (SongManager || e.detail.SongManager)("Song Title");

        manager.addNotes();
        manager.setOnPlay(onPlay);
        
    }

    function onPlay(e) {
        // one context per document
        var context = e.detail.context || new (window.AudioContext || window.webkitAudioContext)();
        var osc = context.createOscillator(); // instantiate an oscillator
        osc.type = 'sine'; // this is the default - also square, sawtooth, triangle
        osc.frequency.value = 555; // Hz
        osc.connect(context.destination); // connect it to the destination
        osc.start(); // start the oscillator
        osc.stop(context.currentTime + 2); // stop 2 seconds after the current time
        console.log('playing');

    }

    
    function SongManager(title) {
        
    }
    
})();