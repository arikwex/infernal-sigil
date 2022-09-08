import * as bus from './bus'
import { clamp } from './utils';

function Audio() {
    let audioCtx = null;
    let sampleRate = null;

    // Sounds to be loaded on init
    let attackSound;
    let attackHitSound;
    let injuredSound;
    let walkSound;
    let jumpSound;
    let dashSound;
    let flapSound;
    let fireballSound;
    let boneCollectSound;
    let switchSound;
    let grantSound;
    let boingSound;

    // Musics
    let musicFocusBuffer;
    let musicStyxBuffer;
    let musicAsphodelBuffer;
    let musicElysianBuffer;
    let musicMourningBuffer;
    let musicThroneBuffer;
    let musicDrumBuffer;
    
    let drumBuffer;
    let activeMusicSource;
    let gainNodeA;
    let gainNodeB;
    let focusNode;
    let usingA = true;

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
                v += sqrp(i / (baseFreq * 2) + sin(i/8000), Math.exp(-envelope*23) * 44 + 1) * 2;
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

        // Player TOOK DAMAGE sound
        injuredSound = generate(0.5, (i) => {
            return 0.05 * (sqr(i/(120+i/250))*0.3 + Math.random())*(sqr(i/600)*0.5+0.5);
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
            return 0.03 * (sin(i/(14+i*i/1000000)) + Math.random()/2);
        });

        // Player flap sound
        flapSound = generate(0.3, (i) => {
            return 0.02 * sin(i/(200 - i / 30));
        });

        // Player fireball sound
        fireballSound = generate(0.4, (i) => {
            return 0.01 * (sqr(i/(20 + i / 100) + Math.random()));
        });

        // Bone collect sound
        boneCollectSound = generate(0.04, (i) => {
            return 0.02 * saw(i/3);
        });

        // Switch sound
        switchSound = generate(2, (i) => {
            return 0.02 * (sqr(i/900) * 0.5 + 0.5) * saw(i/(190));
        });

        // Grant ability sound AND Checkpoint sound
        grantSound = generate(2, (i) => {
            return 0.02 * sqr(i/(1+i/900));
        });

        // Boing when hitting web sound
        boingSound = generate(0.6, (i) => {
            return 0.03 * sin(i/(30+sin(i/900)+i/1300));
        });

        // MUSIC GENERATION
        musicDrumBuffer = audioCtx.createBuffer(1, sampleRate, sampleRate);
        drumBuffer = musicDrumBuffer.getChannelData(0);
        const W = 0.1 * sampleRate;
        for (let j = 0; j < W; j++) {
            drumBuffer[j] += 0.01 * (sin(j/(70 + j/300)) + Math.random() / 3) * (1 - j / W);
            drumBuffer[parseInt(0.5 * sampleRate) + j] += 0.005 * Math.random() * (1 - j / W);
        }

        musicFocusBuffer = audioCtx.createBuffer(1, sampleRate*3, sampleRate);
        const focusBuffer = musicFocusBuffer.getChannelData(0);
        for (let j = 0; j < sampleRate*3; j++) {
            const p = j / sampleRate;
            focusBuffer[j] = sqrp(j/120, 10 + sin(j/10000+p*p*p*4) * 10) * p / 100;
        }

        // Generate 5 procedural songs
        musicStyxBuffer = compileSong(genericSongBuilder(1, [0, 2, 3, 5, 7, 12]), 1.6);
        musicAsphodelBuffer = compileSong(genericSongBuilder(2, [0, 2, 3, 5, 7, 8, 11, 12]), 0.5);
        musicElysianBuffer = compileSong(genericSongBuilder(3, [0, 2, 3, 7, 8, 12]), 0.9);
        musicMourningBuffer = compileSong(genericSongBuilder(4, [0, 2, 3, 7, 8, 12]), 1.2);
        musicThroneBuffer = compileSong(genericSongBuilder(5, [0, 4, 5, 7, 12]), 0.8);
    }

    function genericSongBuilder(seed, melodySignature) {
        const genericSong = [];
        const genericDrums = [];
        const noteLength = [1,4,2,0.5,3,4][seed];
        const noteSpace = [1,1,0.5,0.25,2,2][seed];
        const bassNotes = [-15, -20, -19, -12];
        genericDrums.push(
            [((seed * seed * 3) * 0.5) % 2, (seed) % 2],
            [((seed * seed * 3 + seed * 9) * 0.5) % 2, (seed+1) % 2],
            [((seed * seed * 2 + seed * 11) * 0.5) % 2, (seed+1) % 2],
        );
        for (let i = 0; i < 3; i++) {
            const o = i * 8;
            const q = [0,3,-5][i];
            for (let j = 0; j < 8; j++) {
                genericSong.push([bassNotes[(seed*7+i*2+(j>>1)+j*j*3) % bassNotes.length]+q, j+o, 6, 1]);
            }
            for (let j = 0; j < 8/noteSpace; j++) {
                if ((j + j*j + i+seed*3) % 7 < 4) {
                    genericSong.push([-3+q+melodySignature[(j + j*j*2 + i*i*2+seed) % melodySignature.length], j * noteSpace + o, noteLength, 2]);
                }
            }
        }
        return [genericSong, genericDrums];
    }

    function compileSong([song, drums], beat) {
        const targetBuffer = audioCtx.createBuffer(1, sampleRate * 8 * 3 * beat, sampleRate);
        const buffer = targetBuffer.getChannelData(0);
        for (let i = 0; i < song.length; i++) {
            let note, start, duration, amp;
            [note, start, duration, amp] = song[i];
            writeNote(buffer, note, start * beat, duration * beat, amp);
        }
        for (let q = 0; q < 44; q+=2) {
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
        bus.on('player:hit', play(injuredSound));
        bus.on('walk', play(walkSound));
        bus.on('jump', play(jumpSound));
        bus.on('dash', play(dashSound));
        bus.on('flap', play(flapSound));
        bus.on('fireball', play(fireballSound));
        bus.on('bone:collect', play(boneCollectSound));
        bus.on('bone:dink', play(boneCollectSound));
        bus.on('switch', play(switchSound));
        bus.on('region', onRegion);
        bus.on('focus', () => { focusNode = audioCtx.createBufferSource(); focusNode.buffer = musicFocusBuffer; focusNode.connect(audioCtx.destination); focusNode.start(); });
        bus.on('focus:stop', () => focusNode.stop());
        bus.on('player:grant', play(grantSound));
        bus.on('player:cpt', play(grantSound));
        bus.on('boing', play(boingSound));
        
        gainNodeA = new GainNode(audioCtx);
        gainNodeA.connect(audioCtx.destination);
        gainNodeB = new GainNode(audioCtx);
        gainNodeB.connect(audioCtx.destination);

        music(musicStyxBuffer);
    };
    bus.on('any', enable);

    function onRegion(regionId) {
        music([
            musicStyxBuffer,
            musicAsphodelBuffer,
            musicElysianBuffer,
            musicMourningBuffer,
            musicThroneBuffer,
        ][regionId]);
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