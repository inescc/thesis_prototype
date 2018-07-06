console.log('inside test.js of client');

// Make connection
var socket = io.connect('http://localhost:7000');
talkify.config.remoteService.host = 'https://talkify.net';
talkify.config.remoteService.apiKey = '761f3eca-ca28-4683-a952-704ece6202b9';

// Query DOM
var btn = document.getElementById('rec');

var firstCallAfterClick = false;
    timeoutCall = false,
    putSpace = false,
    clicks = 0, 
    checkpoint = 0,
    save = 0;

/* Quill editor setup */
var quill = new Quill('#editor', {
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        ['image', 'code-block']
      ]
    },
    placeholder: 'Compose the epic...',
    theme: 'snow'  // or 'bubble'
  }); 
var Delta = Quill.import('delta');

/* Speech synthesizer setup — Talkify */

var player = new talkify.TtsPlayer().enableTextHighlighting();
player.forceVoice({name: 'David'});
// var tts = document.getElementById('tts');

function startRecord() {
    console.log('Emitting Record');

    socket.emit('rec', {
        encoding: 'LINEAR16', 
        sampleRateHertz: 16000, 
        languageCode: 'en-US' 
    });
    setTimeout( () => {
        if (socket.connected) {
            timeoutCall = true;
            startRecord();
        }
    }, 64500);
}

// Emit events
btn.addEventListener('click', function(){
    if (btn.checked) {
        clicks++;
        if (clicks == 1) quill.getSelection(0);
        console.log('Calling startRecord()');
             
        socket = io.connect('http://localhost:7000');
        socket.on('connect', startRecord);
        firstCallAfterClick = true;
    }
    else {
        console.log('Disconnecting socket', socket.id);
        socket.destroy();
    }
});

// Listen for events
socket.on('rec', function(data){
    console.log('Reply received on', socket.id);
    quill.focus();
    if (timeoutCall) { putSpace = true; timeoutCall = false; }
    else if (firstCallAfterClick && clicks > 1) { putSpace = true; firstCallAfterClick = false; }
    else putSpace = false;

    if (data.isFinal) {
        function update(value, callback) {
            if (putSpace)
                quill.updateContents(new Delta()
                    .retain(quill.getLength() - save - 1)
                    .delete(save)
                    .insert(' ')
                    .insert(data.transcript)
                    .retain(quill.getSelection().index)
                );
            else
                quill.updateContents(new Delta()
                    .retain(quill.getLength() - save - 1)
                    .delete(save)
                    .insert(data.transcript)
                    .retain(quill.getSelection().index)
                );
            
            callback();
        }

        function callback() {
            save = 0;
            checkpoint += data.transcript.length;
        }

        update(0, callback);
    }

    else {
        if (putSpace)
            quill.updateContents(new Delta()
                .retain(quill.getLength() - save - 1)
                .delete(save)
                .insert(' ')
                .insert(data.transcript, {'color': 'red'})
                .retain(quill.getSelection().index)
            );
        else
            quill.updateContents(new Delta()
                .retain(quill.getLength() - save - 1)
                .delete(save)
                .insert(data.transcript, {'color': 'red'})
                .retain(quill.getSelection().index)
            );
        
        save = data.transcript.length;
        console.log('Saved Length', save)
    }

});


document.getElementById('editor').addEventListener('click', (e) => {
    if (e.metaKey) {
        quill.focus();
        var readFrom = quill.getSelection().index;
        readFrom = quill.getSelection().index;
        var readText = quill.getText(quill.getText().lastIndexOf(' ', readFrom) + 1);
        console.log(readText)
        player.playText(readText);
    }
    else {
        if (player.isPlaying)
            player.pause();
    }

});

document.addEventListener('keydown', (e) => {
    if(e.keyCode == 74 && e.metaKey) {
        var audioPrompt = prompt('Enter prompt');
        // console.log(audioPrompt);
        player.playText(audioPrompt);
    }
});

document.getElementById('cmd1').addEventListener('click', () => {
    var audioPrompt = 'Can you repeat that?'
    player.playText(audioPrompt)
});

document.getElementById('cmd2').addEventListener('click', () => {
    var audioPrompt = 'I did not understand your instruction'
    player.playText(audioPrompt)
});

document.getElementById('cmd3').addEventListener('click', () => {
    var audioPrompt = 'I could not find the words you mentioned'
    player.playText(audioPrompt)
});

document.getElementById('cmd4').addEventListener('click', () => {
    var audioPrompt = 'Where should I insert it?'
    player.playText(audioPrompt)
});

document.getElementById('cmd5').addEventListener('click', () => {
    var audioPrompt = 'Which word, phrase or sentence should I delete?'
    player.playText(audioPrompt)
});

document.getElementById('cmd6').addEventListener('click', () => {
    var audioPrompt = 'Which word, phrase or sentence should I replace?'
    player.playText(audioPrompt)
});

document.getElementById('cmd7').addEventListener('click', () => {
    var audioPrompt = 'I am about to delete'
    player.playText(audioPrompt)
});

document.getElementById('cmd8').addEventListener('click', () => {
    var audioPrompt = 'I am about to replace'
    player.playText(audioPrompt)
});

document.getElementById('cmd9').addEventListener('click', () => {
    var audioPrompt = 'Are these the words you are looking for?'
    player.playText(audioPrompt)
});

document.getElementById('cmd10').addEventListener('click', () => {
    var audioPrompt = 'Is that ok?'
    player.playText(audioPrompt)
});

document.getElementById('cmd11').addEventListener('click', () => {
    var audioPrompt = 'Working on it'
    player.playText(audioPrompt)
});

