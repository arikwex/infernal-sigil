import * as bus from './bus'
import { clamp } from './utils';

function Audio() {
    let audioCtx = null;
    let sampleRate = null;

    // Sounds to be loaded on init
    let attackSound;
    let attackHitSound;

    // Musics
    let musicStyxBuffer;
    let musicAsphodelBuffer;
    let musicDrumBuffer;
    const beat = 0.6;//1.3;
    const b = 3.4;
    const signature = [0, 2, 3, 5, 7, 8, 11, 12, 3, 2, 7, 11, 12, 0, 8, 5];

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
                }
            } else {
                v += saw(i / (4.03 * baseFreq)) * 7;
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
        // musicStyxBuffer = compileSong([
        //     // Bass
        //     [-18, 0, 11, 1],
        //     [-6, 2, 11, 1],
        //     [-19, 4, 11, 1],
        //     [-7, 6, 11, 1],
        //     [-18, 8, 11, 1],
        //     [-6, 10, 11, 1],
        //     [-11, 12, 21, 1],
            
        //     [-18, 16, 21, 1],
        //     [-19, 20, 21, 1],
        //     [-6, 24, 21, 1],
        //     [-11, 28, 21, 1],
            
        //     [-18, 32, 21, 1],
        //     [-19, 36, 21, 1],
        //     [-6, 24, 21, 1],
        //     [-11, 28, 21, 1],
            
        //     // Melody 1
        //     [6, 0+8, b, 2],
        //     [8, 0.5+8, b, 2],
        //     [9, 1+8, b, 2],
        //     [6, 2+8, b, 2],
        //     [8, 2.5+8, b, 2],
        //     [9, 3+8, b, 2],
        //     [13, 4+8, b, 2],
        //     [11, 4.5+8, b, 2],
        //     [8, 5+8, b, 2],
        //     [13, 6+8, b, 2],
        //     [11, 6.5+8, b, 2],
        //     [8, 7+8, b, 2],

        //     // // Melody 2
        //     [6, 8+16, b, 2],
        //     [13, 8.5+16, b, 2],
        //     [18, 9+16, b, 2],
        //     [21, 9.5+16, b, 2],
        //     [20, 10+16, b*2, 2],
        //     [18, 11+16, b*2, 2],
        //     [17, 12+16, b, 2],
        //     [14, 12.5+16, b, 2],
        //     [11, 13+16, b, 2],
        //     [8, 13.5+16, b, 2],
        //     [13, 14+16, b*2, 2],
        // ]);

        const styxSong = [];
        styxSong.push(
            [-18, 0, 11, 1], [-6, 2, 11, 1], [-19, 4, 11, 1], [-7, 6, 11, 1], [-18, 8, 11, 1], [-6, 10, 11, 1],
            [-11, 12, 21, 1], [-18, 16, 21, 1], [-19, 20, 21, 1], [-6, 24, 21, 1],
            [-11-3, 28, 21, 1], [-18-3, 32, 21, 1], [-19-3, 36, 21, 1], [-6-3, 40, 21, 1],
        );
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 32; j++) {
                if ((j + j*j + i * 3) % 9 < 6) {
                    styxSong.push([-6+signature[(j + j*j*3 + i*i*2) % signature.length], j * 0.5 + i * 12, 3, 2]);
                }
            }
        }
        // musicStyxBuffer = compileSong(styxSong);
        
        const asphodelSong = [];
        for (let i = 0; i < 3; i++) {
            const o = i * 16;
            const q = [0,3,-5][i];
            asphodelSong.push(
                [-15+q, 0+o, 6, 1], [-15+q, 1+o, 6, 1], [-20+q, 2+o, 6, 1], [-20+q, 3+o, 6, 1],
                [-19+q, 4+o, 6, 1], [-19+q, 5+o, 6, 1], [-13+q, 6+o, 6, 1], [-12+q, 7+o, 6, 1],
                [-15+q, 8+o, 6, 1], [-15+q, 9+o, 6, 1], [-8+q, 10+o, 6, 1], [-8+q, 11+o, 6, 1],
                [-10+q, 12+o, 6, 1], [-12+q, 13+o, 6, 1], [-13+q, 14+o, 6, 1], [-16+q, 15+o, 6, 1],
            );
            for (let j = 0; j < 32; j++) {
                if ((j + j*j + i) % 7 < 4) {
                    asphodelSong.push([-3+q+signature[(j + j*j*2 + i*i * 2) % signature.length], j * 0.5 + o, 3, 2]);
                }
            }
        }
        musicAsphodelBuffer = compileSong(asphodelSong);

        musicDrumBuffer = audioCtx.createBuffer(1, sampleRate * 1 * beat, sampleRate);
        const drumBuffer = musicDrumBuffer.getChannelData(0);
        const W = 0.1 * sampleRate;
        for (let j = 0; j < W; j++) {
            drumBuffer[j] += 0.03 * (sin(j/(70 + j/300)) + Math.random() / 3) * (1 - j / W);
            drumBuffer[0.5 * sampleRate * beat + j] += 0.01 * Math.random() * (1 - j / W);
            drumBuffer[0.75 * sampleRate * beat + j] += 0.01 * Math.random() * (1 - j / W);
        }
    }

    function compileSong(song) {
        const targetBuffer = audioCtx.createBuffer(1, sampleRate * 44 * beat, sampleRate);
        const buffer = targetBuffer.getChannelData(0);
        for (let i = 0; i < song.length; i++) {
            let note, start, duration, amp;
            [note, start, duration, amp] = song[i];
            writeNote(buffer, note, start * beat, duration * beat, amp);
        }
        return targetBuffer;
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
        
        music(musicDrumBuffer);
        //music(musicStyxBuffer);
        music(musicAsphodelBuffer);
    };
    bus.on('any', enable);

    function music(musicBuffer) {
        musicSource = audioCtx.createBufferSource();
        musicSource.buffer = musicBuffer;
        musicSource.loop = true;
        musicSource.connect(audioCtx.destination);
        musicSource.start();
    }
}

export default Audio;