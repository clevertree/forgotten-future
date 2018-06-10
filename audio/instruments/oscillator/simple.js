

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
     * @returns {number}
     * @param noteFrequency
     * @param noteLength
     * @param oscillatorType
     */
    function OscillatorSimple(noteFrequency, noteLength, oscillatorType) {
        var context = this.getContext();
        var noteStartTime = this.getStartTime() + this.getCurrentPosition();

        var osc = context.createOscillator();   // instantiate an oscillator
        osc.type = oscillatorType || 'square';  // set Type
        osc.frequency.value = noteFrequency;    // set Frequency (hz)

        // Play note
        osc.connect(context.destination);       // connect it to the destination
        osc.start(noteStartTime);               // start the oscillator
        osc.stop(noteStartTime + (noteLength * (240 / (this.getBPM()))));
        // console.info("OSC", noteStartTime, noteEndTime);
        return 1;
    }

    var lastArgs = null;
    OscillatorSimple.processArgs = function(args) {
        args[0] = this.getNoteFrequency(args[0] || lastArgs[0]);
        args[1] = parseFloat(args[1] || lastArgs[1]);
        lastArgs = args;
    }

})();