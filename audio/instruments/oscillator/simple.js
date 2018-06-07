

(function() {
    if(!window.instruments)             window.instruments = {};
    if(!window.instruments.oscillator)  window.instruments.oscillator = {};
    window.instruments.oscillator.simple = OscillatorSimple;
    window.instruments.oscillator.default = OscillatorSimple;
    window.instruments.oscillator.kick = OscillatorSimple;
    window.instruments.oscillator.snare = OscillatorSimple;

    // instrument

    /**
     * Oscillator Instrument
     * @param {AudioContextBase} context
     * @param {Array} args
     * @param {Audio.SongManager} song
     * @returns {number}
     */
    function OscillatorSimple(context, args, song) {
        var noteStartTime = song.currentPosition;
        if(noteStartTime < song.seekPosition) {
            console.warn("Note Skipped");
            return 0;
        }

        var osc = context.createOscillator(); // instantiate an oscillator
        // Set Type
        if(args[3])     OscillatorSimple.lastType = osc.type = args[3];
        else            osc.type = OscillatorSimple.lastType || 'square';

        // Set Frequency
        // if(typeof args[1] === 'string')
        //     args[1] = song.getNoteFrequency(args[1]);
        osc.frequency.value = args[1]; // Hz

        // Play note
        osc.connect(context.destination); // connect it to the destination
        osc.start(song.currentPosition); // start the oscillator
        osc.stop(noteStartTime + args[2] * song.bpmRatio);
        // console.info("OSC", noteStartTime, noteEndTime);
        return 1;
    }

    var lastArgs = null;
    OscillatorSimple.processArgs = function(args, song) {
        args[1] = song.getNoteFrequency(args[1] || lastArgs[1]);
        args[2] = parseFloat(args[2] || lastArgs[2]);
        lastArgs = args;
    }

})();