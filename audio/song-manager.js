
(function() {
    var Util = ForgottenFuture.Util,
        Audio = ForgottenFuture.Audio;

    var DEFAULT_SEEK_TIME = 1;
    var DEFAULT_NOTE_GROUP = 'default';

    Audio.SongManager = SongManager;
    function SongManager(filePath, title, bpm, seekPosition) {
        this.title = title;
        this.instruments = [];
        this.bpmRatio = 240 / (bpm || 160);
        this.seekPosition = seekPosition || 0;

        this.seekTime = DEFAULT_SEEK_TIME;
        this.filePath = filePath;
        this.currentPosition = 0;
        this.startTime = null;
        this.notes = [];
        this.groups = [];
    }

    // Interface Methods

    SongManager.prototype.registerInstruments = function(inst1, inst2) {
        for(var i=0; i<arguments.length; i++)
            if(arguments[i])
                this.instruments.push(arguments[i]);
    };

    SongManager.prototype.startSong = function(context, onPlaybackStarted) {
        this.context = context;
        // if(this.notes) {
        //     this.processPlayback();
        //     onPlaybackStarted(this);
        //
        // } else {
        this.loadFile(this.filePath, function() {
            this.processPlayback();
            onPlaybackStarted && onPlaybackStarted(this);

            document.dispatchEvent(new CustomEvent('song:started', {
                detail: this
            }));
        }.bind(this));
        // }
    };

    SongManager.prototype.getNoteFrequency = function (note) {
        var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],
            octave,
            keyNumber;

        if (note.length === 3) {
            octave = note.charAt(2);
        } else {
            octave = note.charAt(1);
        }

        keyNumber = notes.indexOf(note.slice(0, -1));

        if (keyNumber < 3) {
            keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1;
        } else {
            keyNumber = keyNumber + ((octave - 1) * 12) + 1;
        }

        // Return frequency of note
        return 440 * Math.pow(2, (keyNumber- 49) / 12);
    };

    // File Methods

    SongManager.prototype.loadFile = function(filePath, onLoaded) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === xhr.DONE) {
                if (xhr.status === 200 && xhr.response) {
                    this.processNotes(xhr.response);
                    onLoaded && onLoaded(this);

                } else {
                    console.log("Failed to download:" + xhr.status + " " + xhr.statusText);
                }
            }
        }.bind(this);
        // Open the request for the provided url
        xhr.open("GET", filePath, true);
        // Set the responseType to 'arraybuffer' for ArrayBuffer response
        xhr.responseType = "arraybuffer";
        xhr.send();
    };


    SongManager.prototype.processPlayback = function() {
        this.currentPosition = 0;
        this.startTime = this.context.currentTime - this.seekPosition;
        var notesPlayed = 0;

        var notes = this.groups[DEFAULT_NOTE_GROUP];

        for(var p=0; p<notes.length; p++) {
            notesPlayed += notes[p][0](this.context, notes[p], this);
            if(this.seekPosition + this.seekTime <= this.currentPosition)
                break;
        }
        this.seekPosition += this.seekTime;
        if(notesPlayed > 0) {
            console.log("Seek", this.seekPosition, this.currentPosition);
            setTimeout(this.processPlayback.bind(this), this.seekTime * 1000);

            document.dispatchEvent(new CustomEvent('song:playing', {
                detail: this
            }));
        } else{
            console.log("Song finished");

            // Update UI
            document.dispatchEvent(new CustomEvent('song:finished', {
                detail: this
            }));
        }
    };

    SongManager.prototype.processNotes = function(arrayBuffer) {
        var charBuffer = new Uint8Array(arrayBuffer, 0);
        var byteLength = charBuffer.byteLength;
        console.log(arrayBuffer, byteLength);

        // Iterate through each character in our Array
        this.groups = {default:[]};
        var currentNoteGroup = DEFAULT_NOTE_GROUP, currentNote = [], currentValue = '';
        for (var i = 0; i < byteLength; i++) {
            // Get the character for the current iteration
            var char = String.fromCharCode(charBuffer[i]);

            switch(char) {
                case ",":
                    currentValue = parseValue(currentValue);
                    currentNote.push(currentValue);
                    currentValue = '';
                    break;

                case ";":
                    currentValue = parseValue(currentValue);
                    currentNote.push(currentValue);
                    currentValue = '';

                    switch(currentNote[0][0]) {
                        case 'g':
                            currentNoteGroup = currentNote[1] || DEFAULT_NOTE_GROUP;
                            break;

                        case 'x':
                            currentNote[0] = cExecute;
                            this.groups[currentNoteGroup].push(currentNote);
                            break;

                        case 'p':
                            currentNote[0] = cPause;
                            this.groups[currentNoteGroup].push(currentNote);
                            break;

                        default:
                            if(!/^\+?(0|[1-9]\d*)$/.test(currentNote[0]))
                                throw new Error("Invalid instrument ID: " + currentNote[0]);
                            var instrumentID = parseInt(currentNote[0]);
                            if(!this.instruments[instrumentID])
                                throw new Error("Instrument ID not found: " + instrumentID);
                            var instrument = this.instruments[instrumentID];
                            currentNote[0] = instrument;
                            if(!this.groups[currentNoteGroup])
                                this.groups[currentNoteGroup] = [];
                            if(instrument.processArguments)
                                instrument.processArguments(currentNote);
                            this.groups[currentNoteGroup].push(currentNote);
                            break;
                    }
                    currentNote = []; // Clear note
                    break;

                default:

                    // Check if the char is a new line
                    // if (char === "\r" || char === "\n")
                    //     break;

                    currentValue+=char;
                // console.log("Unexpected Char: ", char);
            }
        }
        if(this.groups[DEFAULT_NOTE_GROUP])
            this.notes = this.groups[DEFAULT_NOTE_GROUP];
        else
            console.warn("Song has no '" + DEFAULT_NOTE_GROUP + "' note group:", this);
    };

    function parseValue(value) {
        value = value.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1').trim();
        if(!isNaN(parseFloat(value)) && isFinite(value))
            value = parseFloat(value);

        return value;
    }


    // Instrument Command

    /**
     * Pause Instrument
     * @param {AudioContextBase} context
     * @param {Array} note
     * @param {SongManager} song
     * @returns {number}
     */
    function cPause(context, note, song) {
        song.currentPosition += note[1] * song.bpmRatio;
        // console.info("PAUSE", note[1]);
        return 0;
    }
    /**
     * Pause Instrument
     * @param {AudioContextBase} context
     * @param {Array} note
     * @param {SongManager} song
     * @returns {number}
     */
    function cExecute(context, note, song) {
        console.info("Execute", note[1]);
        return 0;
    }

})();
