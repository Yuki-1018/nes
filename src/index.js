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
        nes.start();
    };
    
    reader.readAsArrayBuffer(file);
});
