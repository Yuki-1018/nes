import { NES } from 'jsnes';
import AudioContext from 'audio-context';

const nes = new NES({
    onFrame: function(framebuffer_24) {
        const canvas = document.getElementById('nes-canvas');
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, 256, 240);
        const data = imageData.data;

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
        const buffer = audioContext.createBuffer(2, audioBuffer.length / 2, audioContext.sampleRate);
        const leftChannel = buffer.getChannelData(0);
        const rightChannel = buffer.getChannelData(1);

        for (let i = 0; i < audioBuffer.length; i += 2) {
            leftChannel[i / 2] = audioBuffer[i];
            rightChannel[i / 2] = audioBuffer[i + 1];
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();

        audioBuffer = [];
    }
}, 100);

let romData = null;

document.getElementById('rom-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function() {
        romData = new Uint8Array(reader.result);
        alert("ROM loaded. Click 'Start' to play.");
    };

    reader.readAsArrayBuffer(file);
});

document.getElementById('start-button').addEventListener('click', function() {
    if (romData) {
        nes.loadROM(romData);
        nes.start();
    } else {
        alert("Please load a ROM first.");
    }
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
    const memoryEditor = document.getElementById('memory-editor');
    memoryEditor.style.display = memoryEditor.style.display === 'none' ? 'block' : 'none';
    if (memoryEditor.style.display === 'block') {
        document.getElementById('memory-textarea').value = JSON.stringify(nes.cpu.mem, null, 2);
    }
});

document.getElementById('apply-memory').addEventListener('click', function() {
    try {
        const newMemory = JSON.parse(document.getElementById('memory-textarea').value);
        nes.cpu.mem.set(newMemory);
        alert("Memory updated!");
    } catch (e) {
        alert("Failed to update memory: " + e.message);
    }
});
