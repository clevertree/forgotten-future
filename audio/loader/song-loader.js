


(function() {
    // var Util = ForgottenFuture.Util,
    //     Audio = ForgottenFuture.Audio;

    var DEFAULT_SEEK_TIME = 1;
    var DEFAULT_NOTE_GROUP = 'default';

    if(!window.SongLoader)
        window.SongLoader = SongLoader;
    // if(typeof ForgottenFuture !== 'undefined')
    //     ForgottenFuture.Audio.SongLoader = SongLoader;


    function SongLoader(filePath) {
        this.filePath = filePath;
        this.aliases = {};
        this.noteGroups = {};
        this.bpm = 160; // 240 / (bpm || 160);

        this.seekLength = 240 / this.bpm;
        this.seekPosition = 0;
        this.currentPosition = 0;
        this.activeGroups = [];
        // this.groups = [];
    }

    // Playback Commands

    SongLoader.prototype.play = function(context, onPlaybackStarted) {
        this.context = (context || new (window.AudioContext || window.webkitAudioContext)());
        // if(this.notes) {
        //     this.processPlayback();
        //     onPlaybackStarted(this);
        //
        // } else {
        this.currentPosition = null;
        this.loadFile(function(err) {
            if(err)
                throw new Error(err);

            this.activeGroups = [{name: DEFAULT_NOTE_GROUP}];
            this.currentPosition = 0;
            this.startTime = this.context.currentTime - this.seekPosition;
            this.processPlayback();
            onPlaybackStarted && onPlaybackStarted(this);

            document.dispatchEvent(new CustomEvent('song:started', {
                detail: this
            }));
        }.bind(this));
        // }
    };

    SongLoader.prototype.processPlayback = function() {
        var notesPlayed = 0;

        var currentPositionInitial = this.currentPosition;
        for(var gi=0; gi<this.activeGroups.length; gi++) {
            var activeGroup = this.activeGroups[gi];
            var lastNotePosition = activeGroup.lastNotePosition || 0;
            var notes = this.noteGroups[activeGroup.name];

            this.currentPosition = currentPositionInitial + (activeGroup.start || 0);
            // Play default group notes
            for(var p=lastNotePosition; p<notes.length; p++) {
                notesPlayed += notes[p][0](this.context, notes[p], this);
                lastNotePosition++;
                console.log("Note played: ", notes[p], p);
                if(this.seekPosition + this.seekLength <= this.currentPosition)
                    break;
            }
            activeGroup.lastNotePosition = lastNotePosition;
        }


        this.seekPosition += this.seekLength;
        if(notesPlayed > 0) {
            console.log("Notes Played:", notesPlayed, this.seekPosition, this.currentPosition);
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

    // Interface Commands
    SongLoader.prototype.getBPM = function()                { return this.bpm; };
    SongLoader.prototype.getFilePath = function()           { return this.filePath; };
    SongLoader.prototype.getCurrentPosition = function()    { return this.currentPosition; };
    SongLoader.prototype.getStartTime = function()          { return this.startTime; };

    SongLoader.prototype.getInstrument = function(path) {
        if(typeof path === 'function')
            return path;
        if(!window.instruments)
            throw new Error("window.instruments is not loaded");

        var pathList = path.split('.');
        var pathTarget = window.instruments;

        if(this.aliases[pathList[0]])
            pathList[0] = this.aliases[pathList[0]];

        for (var i = 0; i < pathList.length; i++) {
            if (pathTarget[pathList[i]]) {
                pathTarget = pathTarget[pathList[i]];
            } else {
                pathTarget = null;
                break;
            }
        }
        if (pathTarget && typeof pathTarget === 'object')
            pathTarget = pathTarget.default;
        if (!pathTarget)
            throw new Error("Instrument not found: " + pathList.join('.') + ' [alias:' + path + ']');
        return pathTarget;
    };

    SongLoader.prototype.getNoteFrequency = function (note) {
        if(Number(note) === note && note % 1 !== 0)
            return note;
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

    // Loading Methods

    SongLoader.prototype.loadFile = function(onLoaded) {
        var filePath = this.filePath;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === xhr.DONE) {
                if (xhr.status === 200 && xhr.response) {
                    this.processNoteList(xhr.response, onLoaded);

                } else {
                    console.log("Failed to download:" + xhr.status + " " + xhr.statusText);
                    onLoaded("Failed to download:" + xhr.status + " " + xhr.statusText);
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

        console.log('Loaded Command List: ', commandList);
        this.loadCommandList(commandList, onLoaded);
    };

    SongLoader.prototype.loadCommandList = function(commandList, onLoaded) {
        var noteGroups = {};
        noteGroups[DEFAULT_NOTE_GROUP] = [];
        var currentNoteGroup = DEFAULT_NOTE_GROUP;
        var scriptsLoading = 0;
        for(var i=0; i<commandList.length; i++) {
            var args = commandList[i];
            switch(args[0].toLowerCase()) {
                case 'l':
                case 'load':
                    var scriptPath = args[1];
                    scriptsLoading++;
                    loadScript.call(this, scriptPath, function() {
                        // console.log("Scripts loading: ", scriptsLoading);
                        scriptsLoading--;
                        if(scriptsLoading === 0)
                            initNotes.call(this);
                    }.bind(this));
                    break;

                case 'a':
                case 'alias':
                    this.aliases[args[1].trim()] = args[2].trim();
                    break;

                case 'g':
                case 'group':
                    currentNoteGroup = args[1] || DEFAULT_NOTE_GROUP;
                    if(typeof noteGroups[currentNoteGroup] === 'undefined')
                        noteGroups[currentNoteGroup] = [];
                    break;

                case 'ge':
                case 'groupexecute':
                    args[0] = cGroupExecute;
                    noteGroups[currentNoteGroup].push(args);
                    break;

                case 'p':
                case 'pause':
                    args[0] = cPause;
                    args[1] = parseFloat(args[1]);
                    noteGroups[currentNoteGroup].push(args);
                    break;

                case 'n':
                case 'note':
                    args.shift();
                    noteGroups[currentNoteGroup].push(args);
                    break;
            }
        }
        if(scriptsLoading === 0)
            initNotes.call(this);


        function initNotes() {
            for(var groupName in noteGroups) {
                if(noteGroups.hasOwnProperty(groupName)) {
                    var groupList = noteGroups[groupName];
                    for(var i=0; i<groupList.length; i++) {
                        var noteArgs = groupList[i];
                        var instrument = this.getInstrument(noteArgs[0]);
                        noteArgs[0] = instrument;
                        if(instrument.processArgs)
                            instrument.processArgs(noteArgs, this);
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

    // Note Groups

    SongLoader.NoteGroup = function (noteList) {
        
    };

    SongLoader.NoteGroup.prototype.processPlayback = function() {
        var notesPlayed = 0;

        for (var gi = 0; gi < this.activeGroups.length; gi++) {
            var activeGroup = this.activeGroups[gi];
            var lastNotePosition = activeGroup.lastNotePosition || 0;
            var notes = this.noteGroups[activeGroup.name];

            this.currentPosition = currentPositionInitial + (activeGroup.start || 0);
            // Play default group notes
            for (var p = lastNotePosition; p < notes.length; p++) {
                notesPlayed += notes[p][0](this.context, notes[p], this);
                lastNotePosition++;
                console.log("Note played: ", notes[p], p);
                if (this.seekPosition + this.seekLength <= this.currentPosition)
                    break;
            }
            activeGroup.lastNotePosition = lastNotePosition;
        }
    }
    // Instrument Commands

    /**
     * Pause Instrument
     * @param {AudioContextBase} context
     * @param {Array} note
     * @param {SongLoader} song
     * @returns {number}
     */
    function cPause(context, note, song) {
        song.currentPosition += note[1] * (240 / (song.getBPM()));
        console.info("PAUSE", note[1], song.currentPosition);
        return 0;
    }

    /**
     * Pause Instrument
     * @param {AudioContextBase} context
     * @param {Array} note
     * @param {SongLoader} song
     * @returns {number}
     */
    function cGroupExecute(context, note, song) {
        var groupName = note[1].trim();
        console.info("Executing Group: ", groupName);
        song.activeGroups.push({name: groupName, start: song.currentPosition});
        return 0;
    }

})();
