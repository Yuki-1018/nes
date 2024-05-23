import { NES } from 'jsnes';
import AudioContext from 'audio-context';

const nes = new NES({
    onFrame: function(framebuffer_24) {
        let canvas = document.getElementById('nes-canvas');
        let context = canvas.getContext('2d');
        let imageData = context.getImageData(0, 0, 256, 240);
        let data = imageData.data;

        for (let i = 0; i < framebuffer_24.length; i++) {
            data[i] = framebuffer_24[i];
        }

        context.putImageData(imageData, 0, 0);
    },
    onAudioSample: function(left, right) {
        audioBuffer.push(left, right);
    }
});

const audioContext = new AudioContext();
let audioBuffer = [];
let saveState = null;

setInterval(() => {
    if (audioBuffer.length > 0) {
        let buffer = audioContext.createBuffer(2, audioBuffer.length / 2, audioContext.sampleRate);
        let leftChannel = buffer.getChannelData(0);
        let rightChannel = buffer.getChannelData(1);

        for (let i = 0; i < audioBuffer.length; i += 2) {
            leftChannel[i / 2] = audioBuffer[i];
            rightChannel[i / 2] = audioBuffer[i + 1];
        }

        let source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();

        audioBuffer = [];
    }
}, 100);

document.getElementById('rom-input').addEventListener('change', function(event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    
    reader.onload = function() {
        let data = new Uint8Array(reader.result);
        nes.loadROM(data);
    };
    
    reader.readAsArrayBuffer(file);
});

document.getElementById('start-button').addEventListener('click', function() {
    nes.start();
});

document.getElementById('save-state').addEventListener('click', function() {
    saveState = nes.toJSON();
    alert("State saved!");
});

document.getElementById('load-state').addEventListener('click', function() {
    if (saveState) {
        nes.fromJSON(saveState);
        alert("State loaded!");
    } else {
        alert("No state saved.");
    }
});

document.getElementById('toggle-memory-editor').addEventListener('click', function() {
    let memoryEditor = document.getElementById('memory-editor');
    memoryEditor.style.display = memoryEditor.style.display === 'none' ? 'block' : 'none';
    if (memoryEditor.style.display === 'block') {
        document.getElementById('memory-textarea').value = JSON.stringify(nes.cpu.mem, null, 2);
    }
});

document.getElementById('apply-memory').addEventListener('click', function() {
    try {
        let newMemory = JSON.parse(document.getElementById('memory-textarea').value);
        nes.cpu.mem.set(newMemory);
        alert("Memory updated!");
    } catch (e) {
        alert("Failed to update memory: " + e.message);
    }
});
