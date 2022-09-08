import * as bus from './bus'
import { clamp } from './utils';

function Audio() {
    let audioCtx = null;
    let sampleRate = null;

    // Sounds to be loaded on init
    let attackSound;
    let attackHitSound;
    let walkSound;
    let jumpSound;
    let dashSound;
    let flapSound;
    let fireballSound;

    // Musics
    let musicStyxBuffer;
    let musicAsphodelBuffer;
    let musicDrumBuffer;
    let drumBuffer;
    let activeMusicSource;
    let gainNodeA;
    let gainNodeB;
    let usingA = true;
    const signatureStyx = [0, 2, 3, 7, 8, 12, 3, 2, 7, 0, 12];
    const signatureAsphodel = [0, 2, 3, 5, 7, 8, 11, 12, 3, 2, 7, 11, 12, 0, 8, 5];

    const sin = (i) => Math.sin(i);
    const saw = (i) => ((i % 6.28) - 3.14) / 6.28;
    const sqr = (i) => clamp(Math.sin(i) * 1000, -1, 1);
    const sqrp = (i, p) => clamp(Math.sin(i) * p, -1, 1);

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
            return 0.03 * saw(i/(0.3-220*Math.exp(-i/500)));
        });
        
        // Player HIT ENEMY sound
        attackHitSound = generate(0.2, (i) => {
            return 0.05 * (sin(i/(20+i/150))*0.3 + Math.random());
        });

        // Player walk sound
        walkSound = generate(0.04, (i) => {
            return 0.015 * sin(i/(14+i/100));
        });

        // Player jump sound
        jumpSound = generate(0.1, (i) => {
            return 0.008 * sqr(i/(20+150*Math.exp(-i/1600)));
        });

        // Player dash sound
        dashSound = generate(0.3, (i) => {
            return 0.015 * saw(i/(34-i/300));
        });

        // Player flap sound
        flapSound = generate(0.3, (i) => {
            return 0.02 * sin(i/(200 - i / 30));
        });

        // MUSIC GENERATION
        musicDrumBuffer = audioCtx.createBuffer(1, sampleRate, sampleRate);
        drumBuffer = musicDrumBuffer.getChannelData(0);
        const W = 0.1 * sampleRate;
        for (let j = 0; j < W; j++) {
            drumBuffer[j] += 0.01 * (sin(j/(70 + j/300)) + Math.random() / 3) * (1 - j / W);
            drumBuffer[parseInt(0.5 * sampleRate) + j] += 0.005 * Math.random() * (1 - j / W);
        }

        const styxSong = [];
        styxSong.push(
            [-18, 0, 11, 1], [-6, 2, 11, 1], [-19, 4, 11, 1], [-7, 6, 11, 1], [-18, 8, 11, 1], [-6, 10, 11, 1],
            [-11, 12, 21, 1], [-18, 16, 21, 1], [-19, 20, 21, 1], [-6, 24, 21, 1],
            [-11, 28, 21, 1], [-18, 32, 21, 1], [-19, 36, 21, 1], [-6, 40, 21, 1],
        );
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 20; j++) {
                if ((j + j*j + i * 3) % 11 < 7) {
                    styxSong.push([-6+signatureStyx[(j + j*j*2 + i*2 + 3) % signatureStyx.length], j * 0.333 + i * 12, 0.5, 2]);
                }
            }
        }
        musicStyxBuffer = compileSong(styxSong, [[0, 0], [1, 1], [1.5, 1]], 1.3);
        
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
                    asphodelSong.push([-3+q+signatureAsphodel[(j + j*j*2 + i*i * 2) % signatureAsphodel.length], j * 0.5 + o, 3, 2]);
                }
            }
        }
        musicAsphodelBuffer = compileSong(asphodelSong, [[0, 1], [0.5, 0]], 0.6);
    }

    function compileSong(song, drums, beat) {
        const targetBuffer = audioCtx.createBuffer(1, sampleRate * 44 * beat, sampleRate);
        const buffer = targetBuffer.getChannelData(0);
        for (let i = 0; i < song.length*0; i++) {
            let note, start, duration, amp;
            [note, start, duration, amp] = song[i];
            writeNote(buffer, note, start * beat, duration * beat, amp);
        }
        for (let q = 0; q < 44 * 0; q+=2) {
            for (let j = 0; j < drums.length; j++) {
                let type, drumStart;
                [drumStart, type] = drums[j];
                const noteOffset = parseInt(0.5 * sampleRate * type);
                const startOffset = parseInt((drumStart + q) * sampleRate * beat);
                for (let k = 0; k < sampleRate * 0.1; k++) {
                    buffer[k + startOffset] += drumBuffer[k + noteOffset];
                }
            }
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
        bus.on('attack', ([,,,f]) => (f ? 0 : play(attackSound)()));
        bus.on('attack:hit', play(attackHitSound));
        bus.on('walk', play(walkSound));
        bus.on('jump', play(jumpSound));
        bus.on('dash', play(dashSound));
        bus.on('flap', play(flapSound));
        bus.on('fireball', play(fireballSound));
        bus.on('region', onRegion);
        
        gainNodeA = new GainNode(audioCtx);
        gainNodeA.connect(audioCtx.destination);
        gainNodeB = new GainNode(audioCtx);
        gainNodeB.connect(audioCtx.destination);

        music(musicStyxBuffer);
    };
    bus.on('any', enable);

    function onRegion(region) {
        const musicMap = {
            'The Styx': musicStyxBuffer,
            'Asphodel Meadows': musicAsphodelBuffer,
        };
        
        music(musicMap[region]);
    }

    function music(musicBuffer) {
        let audioToStop = activeMusicSource;

        activeMusicSource = audioCtx.createBufferSource();
        activeMusicSource.buffer = musicBuffer;
        activeMusicSource.loop = true;
        activeMusicSource.connect(usingA ? gainNodeA : gainNodeB);
        activeMusicSource.start();

        setTimeout(() => { audioToStop?.stop() }, 700);
        gainNodeA.gain.setTargetAtTime(usingA ? 1 : 0, audioCtx.currentTime, 0.3);
        gainNodeB.gain.setTargetAtTime(usingA ? 0 : 1, audioCtx.currentTime, 1.0);
        usingA = !usingA;
    }
}

export default Audio;