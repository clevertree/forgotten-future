


(function() {
    // var Util = ForgottenFuture.Util,
    //     Audio = ForgottenFuture.Audio;

    var DEFAULT_SEEK_TIME = 1;
    var DEFAULT_NOTE_GROUP = 'default';

    if(!window.SongLoader)
        window.SongLoader = SongLoader;
    if(typeof ForgottenFuture !== 'undefined')
        ForgottenFuture.Audio.SongLoader = SongLoader;


    function SongLoader(filePath) {
        this.filePath = filePath;
        this.instruments = {};
        this.noteGroups = {};
        this.bpmRatio = 1; // 240 / (bpm || 160);

        this.seekLength = DEFAULT_SEEK_TIME;
        this.seekPosition = 0;
        this.currentPosition = 0;
        // this.groups = [];
    }

    SongLoader.prototype.play = function(context, onPlaybackStarted) {
        this.context = (context || new (window.AudioContext || window.webkitAudioContext)());
        // if(this.notes) {
        //     this.processPlayback();
        //     onPlaybackStarted(this);
        //
        // } else {
        this.loadFile(function() {
            this.processPlayback();
            onPlaybackStarted && onPlaybackStarted(this);

            document.dispatchEvent(new CustomEvent('song:started', {
                detail: this
            }));
        }.bind(this));
        // }
    };

    SongLoader.prototype.getNoteFrequency = function (note) {
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


    SongLoader.prototype.processPlayback = function() {
        this.currentPosition = 0;
        this.startTime = this.context.currentTime - this.seekPosition;
        var notesPlayed = 0;

        var notes = this.groups[DEFAULT_NOTE_GROUP];

        for(var p=0; p<notes.length; p++) {
            notesPlayed += notes[p][0](this.context, notes[p], this);
            if(this.seekPosition + this.seekLength <= this.currentPosition)
                break;
        }
        this.seekPosition += this.seekLength;
        if(notesPlayed > 0) {
            console.log("Seek", this.seekPosition, this.currentPosition);
            setTimeout(this.processPlayback.bind(this), this.seekLength * 1000);

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

    SongLoader.prototype.loadCommandList = function(commandList, onLoaded) {
        var noteGroups = {};
        noteGroups[DEFAULT_NOTE_GROUP] = [];
        var currentNoteGroup = DEFAULT_NOTE_GROUP;
        var scriptsLoaded = 0;
        for(var i=0; i<commandList.length; i++) {
            var args = commandList[i];
            switch(args[0].toLowerCase()) {
                case 'l':
                case 'load':
                    var scriptPath = args[1];
                    loadScript.call(this, scriptPath, initInstruments.bind(this));
                    scriptsLoaded++;
                    break;

                case 'i':
                case 'instrument':
                    var instrumentCallback = args[1];
                    var instrumentName = args[2].trim();
                    this.instruments[instrumentName] = {
                        callback: null, // function() { console.warn("Instrument is uninitiated: ", instrumentClass); }
                        callbackName: instrumentCallback,
                        title: instrumentName
                    };
                    break;

                case 'g':
                case 'group':
                    currentNoteGroup = args[1] || DEFAULT_NOTE_GROUP;
                    if(typeof noteGroups[currentNoteGroup] === 'undefined')
                        noteGroups[currentNoteGroup] = [];
                    break;

                case 'p':
                case 'pause':
                    args[0] = cPause;
                    args[1] = parseFloat(args[1]);
                    break;

                case 'n':
                case 'note':
                    args.shift();
                    noteGroups[currentNoteGroup].push(args);
                    break;
            }
        }
        if(scriptsLoaded === 0)
            initInstruments.call(this);

        function initInstruments() {
            var allInstrumentsLoaded = true;
            for(var instrumentName in this.instruments) {
                if(this.instruments.hasOwnProperty(instrumentName)) {
                    var instrument = this.instruments[instrument];
                    if(!instrument.callback) {
                        var classPath = instrument.callbackName.split('.');
                        var pathTarget = window.instruments;
                        for (var i = 0; i < classPath.length; i++) {
                            if (pathTarget[classPath[i]]) {
                                pathTarget = pathTarget[classPath[i]];
                            } else {
                                pathTarget = null;
                            }
                        }
                        if (pathTarget) {
                            instrument.callback = pathTarget;
                            console.log("Instrument loaded: ", instrument);
                        }
                    }
                    if(!instrument.callback)
                        allInstrumentsLoaded = false;
                }
            }

            if(allInstrumentsLoaded && onLoaded)
                initNotes.call(this);
        }

        function initNotes() {
            for(var groupName in noteGroups) {
                if(noteGroups.hasOwnProperty(groupName)) {
                    var groupList = noteGroups[groupName];
                    for(var i=0; i<groupList.length; i++) {
                        var noteArgs = groupList[i];
                        var noteInstrumentName = noteArgs[0];
                        if(!this.instruments[noteInstrumentName])
                            throw new Error("Instrument '" + noteInstrumentName + "' was not registered");
                        var instrument = this.instruments[noteInstrumentName];
                        if(typeof instrument.callback === 'undefined')
                            throw new Error("Instrument '" + noteInstrumentName + "' was not initiated");
                        noteArgs[0] = instrument.callback;
                        if(instrument.callback.processArgs)
                            instrument.callback.processArgs(noteArgs);
                    }
                }
            }
            this.noteGroups = noteGroups;
            console.log("Finished processing notes:", noteGroups);

            onLoaded && onLoaded();
        }

        function loadScript(scriptPath, onLoaded) {
            var fileDirectory = /^.*\//.exec(this.filePath)[0];
            var stack = fileDirectory.split("/"),
                parts = scriptPath.split("/");
            stack.pop(); // remove current file name (or empty string)
            for (var i=0; i<parts.length; i++) {
                if (parts[i] === ".")   continue;
                if (parts[i] === "..")  stack.pop();
                else                    stack.push(parts[i]);
            }
            scriptPath = stack.join("/"); // Calculate relative path

            var scriptPathEsc = scriptPath.replace(/[/.]/g, '\\$&');
            var foundScript = document.head.querySelectorAll('script[src=' + scriptPathEsc + ']');
            if (foundScript.length === 0) {
                var scriptElm = document.createElement('script');
                scriptElm.src = scriptPath;
                scriptElm.onload = onLoaded;
                document.head.appendChild(scriptElm);
            }
        }

    };

    // File Methods

    SongLoader.prototype.loadFile = function(onLoaded) {
        var filePath = this.filePath;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === xhr.DONE) {
                if (xhr.status === 200 && xhr.response) {
                    this.processNoteList(xhr.response, onLoaded);

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

    SongLoader.prototype.processNoteList = function(arrayBuffer, onLoaded) {
        var charBuffer = new Uint8Array(arrayBuffer, 0);
        var byteLength = charBuffer.byteLength;

        // Iterate through each character in our Array
        this.groups = {default:[]};

        var lastCharBuffer = '';
        var commandList = [];
        for (var i = 0; i < byteLength; i++) {
            // Get the character for the current iteration
            var char = String.fromCharCode(charBuffer[i]);
            lastCharBuffer += char;
            switch(char) {
                case ')':
                    lastCharBuffer = lastCharBuffer.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1').trim();
                    var match = /([a-z]+)\(([^)]+)\)/.exec(lastCharBuffer);
                    if(match) {
                        var commandName = match[1];
                        var commandArgs = match[2].split(/\s*,\s*/);
                        commandArgs.unshift(commandName);
                        lastCharBuffer = '';
                        commandList.push(commandArgs);
                        // console.log('Processed Note List: ', lastCharBuffer, commandArgs);

                    }
                    break;
            }
        }

        console.log('Processed Command List: ', commandList);
        this.loadCommandList(commandList, onLoaded);
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
     * @param {SongLoader} song
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
     * @param {SongLoader} song
     * @returns {number}
     */
    function cExecute(context, note, song) {
        console.info("Execute", note[1]);
        return 0;
    }

})();
