
(function() {
    var Util = ForgottenFuture.Util,
        Audio = ForgottenFuture.Audio;


    Audio.SongManager = SongManager;
    function SongManager(filePath, bpm, seekPosition) {
        this.instruments = [cPause];
        this.bpmRatio = 240 / (bpm || 160);
        this.seekPosition = seekPosition;

        this.seekTime = SEEK_TIME;
        this.currentPosition = 0;
        this.startTime = null;
        this.filePath = null;
        this.notes = [];
        this.groups = [];
    }

    SongManager.prototype.registerInstruments = function(inst1, inst2) {
        for(var i=0; i<arguments.length; i++)
            if(arguments[i])
                this.instruments.push(arguments[i]);
    };

    SongManager.prototype.loadFile = function(filePath, onLoaded) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === xhr.DONE) {
                if (xhr.status === 200 && xhr.response) {
                    this.processNotes(xhr.response);
                    onLoaded(this);

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

    SongManager.prototype.startSong = function(context, onPlaybackStarted) {
        this.context = context;
        // if(this.notes) {
        //     this.processPlayback();
        //     onPlaybackStarted(this);
        //
        // } else {
        this.loadFile(this.filePath, function() {
            this.processPlayback();
            onPlaybackStarted(this);
        }.bind(this));
        // }
    };

    SongManager.prototype.processPlayback = function() {
        this.currentPosition = 0;
        this.startTime = this.context.currentTime - this.seekPosition;
        var notesPlayed = 0;

        for(var p=0; p<notes.length; p++) {
            notesPlayed += notes[p][0](this.context, notes[p], this);
            if(this.seekPosition + this.seekTime <= this.currentPosition)
                break;
        }
        this.seekPosition += this.seekTime;
        if(notesPlayed > 0) {
            console.log("Seek", this.seekPosition, this.currentPosition);
            setTimeout(this.processPlayback.bind(this), this.seekTime * 1000);
        } else{
            console.log("Song finished")
        }
    };

    SongManager.prototype.processNotes = function(arrayBuffer) {
        var charBuffer = new Uint8Array(arrayBuffer, 0);
        var byteLength = charBuffer.byteLength;
        console.log(arrayBuffer, byteLength);

        // Iterate through each character in our Array
        this.notes = [];
        this.groups = [];
        var noteGroup = 0, values = [], lastValue = '';
        for (var i = 0; i < byteLength; i++) {
            // Get the character for the current iteration
            var char = String.fromCharCode(charBuffer[i]);

            switch(char) {
                case ",":
                    if(lastValue === '.')
                        lastValue = parseFloat(lastValue);
                    values.push(lastValue);
                    lastValue = '';
                    break;

                case ";":
                    if (values[0][0] ===  'g') {
                        values.shift();
                        this.groups.push(values);
                        noteGroup++;
                        break;
                    }
                    if(!/^\+?(0|[1-9]\d*)$/.test(values[0]))
                        throw new Error("Invalid instrument ID: " + values[0]);
                    var instrumentID = parseInt(values[0]);
                    if(!this.instruments[instrumentID])
                        throw new Error("Instrument ID not found: " + instrumentID);
                    var instrument = this.instruments[instrumentID];
                    values[0] = instrument;
                    if(!this.notes[noteGroup])
                        this.notes[noteGroup] = [];
                    if(instrument.processArguments)
                        instrument.processArguments(values);
                    this.notes[noteGroup].push(values);
                    break;

                default:

                    // Check if the char is a new line
                    if (char.match(/[^\r\n]+/g) !== null)
                        break;

                    lastValue+=char;
                // console.log("Unexpected Char: ", char);
            }
        }
    };

})();
