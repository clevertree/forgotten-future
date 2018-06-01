

(function() {
    document.addEventListener('song:play', onPlay);

    function onPlay(e) {
        var title = "Song Title";
        if (e.detail && e.detail.title && e.detail.title !== title)
            return false;
        e.preventDefault();

        // one context per document
        var context = (e.detail||{}).context || new (window.AudioContext || window.webkitAudioContext)();
        var osc = context.createOscillator(); // instantiate an oscillator
        osc.type = 'sawtooth'; // this is the default - also square, sawtooth, triangle
        osc.frequency.value = 75; // Hz
        osc.connect(context.destination); // connect it to the destination
        osc.start(); // start the oscillator
        osc.stop(context.currentTime + 2); // stop 2 seconds after the current time

        // Update
        document.dispatchEvent(new CustomEvent('song:playing', {
            detail: {
                title: title,
                position: 0,
                duration: 2,
                oscillator: osc
            }
        }));
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