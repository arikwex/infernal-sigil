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
    let activeMusicSource;
    let gainNodeA;
    let gainNodeB;
    let usingA = true;
    const beat = 0.8;//0.9;//1.3;
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
        const baseFreq = 6*(2**(-tone/12))*2;
        const baseIdx = parseInt(startTime * sampleRate);
        const dur = parseInt(duration * sampleRate);
        for (let i = 0; i < dur && i < dest.length; i++) {
            let v = 0; 
            const envelope = i / dur; 
            if (a == 1) {
                for (let j = 1; j < 4*0+2; j++) {
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

        // MUSIC GENERATION
        musicDrumBuffer = audioCtx.createBuffer(1, sampleRate * 1 * beat, sampleRate);
        const drumBuffer = musicDrumBuffer.getChannelData(0);
        const W = 0.1 * sampleRate;
        for (let j = 0; j < W; j++) {
            drumBuffer[j] += 0.01 * (sin(j/(70 + j/300)) + Math.random() / 3) * (1 - j / W);
            drumBuffer[0.5 * sampleRate * beat + j] += 0.005 * Math.random() * (1 - j / W);
            drumBuffer[0.75 * sampleRate * beat + j] += 0.005 * Math.random() * (1 - j / W);
        }

        const styxSong = [];
        styxSong.push(
            [-18, 0, 11, 1], [-6, 2, 11, 1], [-19, 4, 11, 1], [-7, 6, 11, 1], [-18, 8, 11, 1], [-6, 10, 11, 1],
            [-11, 12, 21, 1], [-18, 16, 21, 1], [-19, 20, 21, 1], [-6, 24, 21, 1],
            [-11, 28, 21, 1], [-18, 32, 21, 1], [-19, 36, 21, 1], [-6, 40, 21, 1],
        );
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 12; j++) {
                if ((j + j*j + i * 3) % 11 < 7) {
                    styxSong.push([-6+signature[(j + j*j*2 + i*2 + 3) % signature.length], j * 0.6666 + i * 12, 3, 2]);
                }
            }
        }
        musicStyxBuffer = compileSong(styxSong, drumBuffer);
        
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
        musicAsphodelBuffer = compileSong(asphodelSong, drumBuffer);
    }

    function compileSong(song, drumBuffer) {
        const targetBuffer = audioCtx.createBuffer(1, sampleRate * 44 * beat, sampleRate);
        const buffer = targetBuffer.getChannelData(0);
        for (let i = 0; i < song.length; i++) {
            let note, start, duration, amp;
            [note, start, duration, amp] = song[i];
            writeNote(buffer, note, start * beat, duration * beat, amp);
        }
        for (let j = 0; j < buffer.length; j++) {
            buffer[j] += drumBuffer[j % drumBuffer.length];
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
        bus.on('region', onRegion);
        
        gainNodeA = new GainNode(audioCtx);
        gainNodeA.connect(audioCtx.destination);
        gainNodeB = new GainNode(audioCtx);
        gainNodeB.connect(audioCtx.destination);
        // gainNodeA.gain = 5;
        // gainNodeB.gain = 0;

        music(musicStyxBuffer);
        // music(musicAsphodelBuffer);
    };
    bus.on('any', enable);

    function onRegion(region) {
        const musicMap = {
            'The Styx': musicStyxBuffer,
            'Asphodel Meadows': musicAsphodelBuffer,
        };
        
        // let fadeoutSource = activeMusicSource;
        // let fadeAway = setInterval(() => activeMusicSource.vol)
        // activeMusicSource?.stop();
        music(musicMap[region]);
    }

    function music(musicBuffer) {
        let audioToStop = activeMusicSource;

        activeMusicSource = audioCtx.createBufferSource();
        activeMusicSource.buffer = musicBuffer;
        activeMusicSource.loop = true;
        activeMusicSource.connect(usingA ? gainNodeA : gainNodeB);
        activeMusicSource.start(1);

        setTimeout(() => { audioToStop?.stop() }, 700);
        gainNodeA.gain.setTargetAtTime(usingA ? 1 : 0, audioCtx.currentTime, 0.7);
        gainNodeB.gain.setTargetAtTime(usingA ? 0 : 1, audioCtx.currentTime, 1.0);
        usingA = !usingA;
    }
}

export default Audio;