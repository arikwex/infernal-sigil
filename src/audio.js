import * as bus from './bus'
import { clamp } from './utils';

function Audio() {
    let audioCtx = null;
    let sampleRate = null;

    // Sounds to be loaded on init
    let attackSound;
    let attackHitSound;
    let musicBuffer;

    const sin = (i) => Math.sin(i);
    const saw = (i) => ((i % 6.28) - 3.14) / 6.28;
    const sqr = (i) => clamp(Math.sin(i) * 1000, -1, 1);
    const sqrp = (i, p) => clamp(Math.sin(i) * p, -1, 1);
    const win = (i, ts, te) => {
        if (i < ts * 44100 || i > te * 44100) { return 0; }
        return 1 - ((i / 44100) - ts) / (te - ts);
    }

    function generate(duration, fn) {
        var audioBuffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        var buffer = audioBuffer.getChannelData(0);
        var N = audioBuffer.length;
        for (let i = 0; i < N; i++) {
            buffer[i] = fn(i * 44100 / sampleRate) * (1 - i/N);
        }
        return audioBuffer;
    }

    function writeNote(dest, tone, startTime, duration, a) {
        const baseFreq = 6*(2**(-tone/12));
        const baseIdx = parseInt(startTime * sampleRate);
        const dur = parseInt(duration * sampleRate);
        for (let i = 0; i < dur && i < dest.length; i++) {
            let v = 0; 
            const envelope = i / dur; 
            if (a == 1) {
                for (let j = 1; j < 4; j++) {
                    v += sqrp(i / ((2**j) * baseFreq) + sin(i/8000), Math.exp(-envelope*23) * 44 + 1) / (1.5**-j);
                    // v += sqrp(i / ((2**j) * baseFreq) + sin(i/8000), 2) / (1.5**j);
                }
            } else {
                v += sin(i / (4.03 * baseFreq)) * 7;
            }
            dest[baseIdx + i] += v * Math.min(envelope * Math.exp(-envelope * (10 + a * 7)) * 100, 1) / 700;
        }
    }

    function init() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        sampleRate = audioCtx.sampleRate;

        // Player swipe attack sound
        attackSound = generate(0.2, (i) => {
            return 0.03 * (sin(i/(20+i/150))*0.3 + Math.random());
        });

        // Player HIT sound
        attackHitSound = generate(0.3, (i) => {
            return 0.05 * sqr(i/(20+i/60));
        });

        // Music
        const beat = 1.5;
        const b = 3.4;
        musicBuffer = audioCtx.createBuffer(1, sampleRate * 32 * beat, sampleRate);
        const buffer = musicBuffer.getChannelData(0);
        const song = [
            // Bass
            [-18, 0, 11, 1],
            [-6, 2, 11, 1],
            [-19, 4, 11, 1],
            [-7, 6, 11, 1],
            [-18, 8, 11, 1],
            [-6, 10, 11, 1],
            [-11, 12, 21, 1],
            [-18, 16, 21, 1],
            [-19, 20, 21, 1],
            [-6, 24, 21, 1],
            [-11, 28, 21, 1],
            
            // Melody 1
            [6, 0, b, 2],
            [8, 0.5, b, 2],
            [9, 1, b, 2],
            [6, 2, b, 2],
            [8, 2.5, b, 2],
            [9, 3, b, 2],
            [13, 4, b, 2],
            [11, 4.5, b, 2],
            [8, 5, b, 2],
            [13, 6, b, 2],
            [11, 6.5, b, 2],
            [8, 7, b, 2],

            // Melody 2
            [6, 8, b, 2],
            [13, 8.5, b, 2],
            [18, 9, b, 2],
            [21, 9.5, b, 2],
            [20, 10, b*2, 2],
            [18, 11, b*2, 2],
            [17, 12, b, 2],
            [14, 12.5, b, 2],
            [11, 13, b, 2],
            [8, 13.5, b, 2],
            [13, 14, b*2, 2],
            
            // Melody 3
            [6, 16, b, 2],
            [9, 17, b, 2],
            [6, 18, b, 2],
            [9, 22, b, 2],
            [11, 23.5, b, 2],
            [13, 25, b, 2],
            [6, 26, b, 2],
            [9, 27, b, 2],
            [6, 28, b, 2],
            [9, 30, b, 2],
        ];
        for (let i = 0; i < song.length; i++) {
            let note, start, duration, amp;
            [note, start, duration, amp] = song[i];
            writeNote(buffer, note, start * beat, duration * beat, amp);
            // writeNote(buffer, 7, 1, 1.9);
            // writeNote(buffer, 7, 2, 1.9);
            // writeNote(buffer, 7, 3, 1.9);
            // writeNote(buffer, -2, 4, 1.9);
        }
    }

    function play(audioBuffer) {
        return () => {
            var source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start();
        }
    };

    function enable() {
        if (audioCtx) { return; }
        bus.off('any', enable);
        init();
        bus.on('attack', play(attackSound));
        bus.on('attack:hit', play(attackHitSound));
        music();
    };
    bus.on('any', enable);

    function music() {
        musicSource = audioCtx.createBufferSource();
        musicSource.buffer = musicBuffer;
        musicSource.loop = true;
        musicSource.connect(audioCtx.destination);
        musicSource.start();
    }
}

export default Audio;