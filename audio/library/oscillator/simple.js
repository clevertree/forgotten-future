

(function() {
    var Audio = ForgottenFuture.Audio;

    Audio.Instruments.iOscillatorSimple = iOscillatorSimple;

    // Instruments

    /**
     * Oscillator Instrument
     * @param {AudioContextBase} context
     * @param {Array} note
     * @param {Audio.SongManager} song
     * @returns {number}
     */
    function iOscillatorSimple(context, note, song) {
        var noteStartTime = song.currentPosition;
        if(noteStartTime < song.seekPosition) {
            console.warn("Note Skipped");
            return 0;
        }

        var osc = context.createOscillator(); // instantiate an oscillator
        // Set Type
        if(note[3])     iOscillatorSimple.lastType = osc.type = note[3];
        else            osc.type = iOscillatorSimple.lastType || 'square';

        // Set Frequency
        if(typeof note[1] === 'string')
            note[1] = song.getNoteFrequency(note[1]);
        osc.frequency.value = note[1]; // Hz

        // Play note
        osc.connect(context.destination); // connect it to the destination
        osc.start(song.currentPosition); // start the oscillator
        osc.stop(noteStartTime + note[2] * song.bpmRatio);
        // console.info("OSC", noteStartTime, noteEndTime);
        return 1;
    }

})();