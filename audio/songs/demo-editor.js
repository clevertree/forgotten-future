

(function() {
    var Util = ForgottenFuture.Util,
        Audio = ForgottenFuture.Audio;

    const TITLE = "Editor Demo";

    document.addEventListener('song:play', onPlay);

    // Dependencies
    Util.loadScript([
        'audio/song-manager.js',
    ]);


    function onPlay(e) {
        if (e.defaultPrevented || (e.detail && e.detail.title && e.detail.title !== TITLE))
            return false;
        e.preventDefault();

        var context = (e.detail||{}).context || new (window.AudioContext || window.webkitAudioContext)();


        Util.waitForLoadingScripts(function() {
            var editableSong = new Audio.SongManager('audio/songs/demo-notes.csv', TITLE);
            editableSong.registerInstruments(
                iOSC
            );

            editableSong.startSong(context, function() {
                // Update
                document.dispatchEvent(new CustomEvent('song:playing', {
                    detail: {
                        title: TITLE,
                        position: 0,
                        duration: 2,
                        song: editableSong
                    }
                }));
            });

        });
    }


    // Instruments

    /**
     * Oscillator Instrument
     * @param {AudioContextBase} context
     * @param {Array} note
     * @param {Audio.SongManager} song
     * @returns {number}
     */
    function iOSC(context, note, song) {
        var noteStartTime = song.currentPosition;
        if(noteStartTime < song.seekPosition) {
            console.warn("Note Skipped");
            return 0;
        }

        var osc = context.createOscillator(); // instantiate an oscillator
        // Set Type
        if(note[3])     iOSC.lastType = osc.type = note[3];
        else            osc.type = iOSC.lastType || 'square';

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

    // function SongManager(title, options) {
    //     this.title = title;
        // options = options                   || {};
        // this.notes = options.notes          || [];
    // }

    // SongManager.prototype.matchesEvent = function(e) {
    //     return !(e.detail && e.detail.title && e.detail.title !== this.title);

    // };

    // SongManager.prototype.addNotes = function(notes) {
    //     throw new Error("Unimplemented");
    // };

    // SongManager.prototype.playNotes = function(e) {
    //     throw new Error("Unimplemented");
    // };

    
})();