import * as bus from './bus'
import { clamp } from './utils';
import { EVENT_ATTACK, EVENT_ATTACK_HIT, EVENT_BONE_COLLECT, EVENT_BONE_DINK, EVENT_DASH, EVENT_FIREBALL, EVENT_FLAP, EVENT_FOCUS, EVENT_FOCUS_STOP, EVENT_JUMP, EVENT_PLAYER_ABILITY_GRANT, EVENT_PLAYER_CHECKPOINT, EVENT_PLAYER_HIT, EVENT_REGION, EVENT_SWITCH, EVENT_WALK, EVENT_WEB_BOING } from './events';

function Audio() {
    audioCtx = new AudioContext();
    sampleRate = audioCtx.sampleRate;

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
    let musicRegionBuffers;
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

    async function _yield() {
        return new Promise((r) => setTimeout(r, 0));
    }

    function setProgress(p) {
        bus.emit('load-progress', p);
    }

    async function generate(duration, fn) {
        let audioBuffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        let buffer = audioBuffer.getChannelData(0);
        let N = audioBuffer.length;
        for (let i = 0; i < N; i++) {
            buffer[i] = fn(i * 44100 / sampleRate) * (1 - i/N);
        }
        await _yield();
        return audioBuffer;
    }

    async function init() {
        // Player swipe attack sound
        attackSound = await generate(0.2, (i) => {
            return 0.05 * saw(i/(0.3-220*Math.exp(-i/500)));
        });
        
        // Player HIT ENEMY sound
        attackHitSound = await generate(0.2, (i) => {
            return 0.1 * (sin(i/(20+i/150))*0.3 + Math.random());
        });
        setProgress(0.05);

        // Player TOOK DAMAGE sound
        injuredSound = await generate(0.5, (i) => {
            return 0.1 * (sqr(i/(120+i/250))*0.3 + Math.random())*(sqr(i/600)*0.5+0.5);
        });

        // Player walk sound
        walkSound = await generate(0.02, (i) => {
            return 0.06 * sin(i/30) * Math.exp(-i/100);
        });
        setProgress(0.1);

        // Player jump sound
        jumpSound = await generate(0.1, (i) => {
            return 0.02 * sqr(i/(20+150*Math.exp(-i/1600)));
        });

        // Player dash sound
        dashSound = await generate(0.3, (i) => {
            return 0.06 * (sin(i/(14+i*i/1e6)) + Math.random()/2);
        });
        setProgress(0.15);

        // Player flap sound
        flapSound = await generate(0.3, (i) => {
            return 0.05 * sin(i/(200 - i / 30));
        });

        // Player fireball sound
        fireballSound = await generate(0.4, (i) => {
            return 0.03 * (sqr(i/(20 + i / 100) + Math.random()));
        });
        setProgress(0.2);

        // Bone collect sound
        boneCollectSound = await generate(0.06, (i) => {
            return 0.03 * saw(i/4);
        });

        // Switch sound
        switchSound = await generate(1.5, (i) => {
            return 0.1 * (sqr(i/800) * 0.5 + 0.5) * saw(i/(110));
        });
        setProgress(0.25);

        // Grant ability sound AND Checkpoint sound
        grantSound = await generate(2, (i) => {
            return 0.04 * sqr(i/(1+i/900));
        });

        // Boing when hitting web sound
        boingSound = await generate(0.6, (i) => {
            return 0.06 * sin(i/(20+sin(i/900)+i/1300));
        });
        setProgress(0.3);

        // MUSIC GENERATION
        musicDrumBuffer = audioCtx.createBuffer(1, sampleRate, sampleRate);
        drumBuffer = musicDrumBuffer.getChannelData(0);
        const W = 0.1 * sampleRate;
        for (let j = 0; j < W; j++) {
            drumBuffer[j] += 0.01 * (sin(j/(70 + j/300)) + Math.random() / 3) * (1 - j / W);
            drumBuffer[parseInt(0.5 * sampleRate) + j] += 0.01 * Math.random() * (1 - j / W);
        }
        await _yield();

        musicFocusBuffer = audioCtx.createBuffer(1, sampleRate*3, sampleRate);
        const focusBuffer = musicFocusBuffer.getChannelData(0);
        for (let j = 0; j < sampleRate*3; j++) {
            const p = j / sampleRate;
            focusBuffer[j] = clamp(Math.sin(j/120) * (10 + sin(j/10000+p*p*p*4) * 10), -1, 1) * p / 50;
        }
        await _yield();
        setProgress(0.35);

        // Generate 5 procedural songs
        const song1 = await genericSongBuilder([[0, 2, 3, 5, 7, 12], 1.3], 0, 0.35, 0.45);
        setProgress(0.7);
        const song2 = await genericSongBuilder([[0, 2, 3, 5, 7, 8, 11, 12], 0.5], 1, 0.45, 0.6);
        setProgress(0.75);
        const song3 = await genericSongBuilder([[0, 2, 3, 7, 8, 12], 0.9], 2, 0.6, 0.7);
        setProgress(0.8);
        const song4 = await genericSongBuilder([[0, 2, 3, 7, 8, 12], 1.2], 3, 0.7, 0.85);
        setProgress(0.9);
        const song5 = await genericSongBuilder([[0, 4, 5, 7, 12], 0.8], 4, 0.85, 0.99);
        setProgress(0.99);
        musicRegionBuffers = [song1, song2, song3, song4, song5];

        // bus events
        bus.on(EVENT_ATTACK, ([,,,f]) => (f ? 0 : play(attackSound)()));
        bus.on(EVENT_ATTACK_HIT, play(attackHitSound));
        bus.on(EVENT_PLAYER_HIT, play(injuredSound));
        bus.on(EVENT_WALK, play(walkSound));
        bus.on(EVENT_JUMP, play(jumpSound));
        bus.on(EVENT_DASH, play(dashSound));
        bus.on(EVENT_FLAP, play(flapSound));
        bus.on(EVENT_FIREBALL, play(fireballSound));
        bus.on(EVENT_BONE_COLLECT, play(boneCollectSound));
        bus.on(EVENT_BONE_DINK, play(boneCollectSound));
        bus.on(EVENT_SWITCH, play(switchSound));
        bus.on(EVENT_REGION, onRegion);
        bus.on(EVENT_FOCUS, () => {
            focusNode = audioCtx.createBufferSource();
            focusNode.buffer = musicFocusBuffer;
            focusNode.connect(audioCtx.destination);
            focusNode.start(); 
        });
        bus.on(EVENT_FOCUS_STOP, () => focusNode.stop());
        bus.on(EVENT_PLAYER_ABILITY_GRANT, play(grantSound));
        bus.on(EVENT_PLAYER_CHECKPOINT, play(grantSound));
        bus.on(EVENT_WEB_BOING, play(boingSound));
        
        // crossfade gain nodes
        gainNodeA = new GainNode(audioCtx);
        gainNodeA.connect(audioCtx.destination);
        gainNodeB = new GainNode(audioCtx);
        gainNodeB.connect(audioCtx.destination);
    }

    async function genericSongBuilder([melodySignature, beat], seed, prog1, prog2) {
        // Song builder
        const song = [];
        const drums = [];
        const noteLength = [4,2,0.5,3,4][seed];
        const noteSpace = [1,0.5,0.25,2,2][seed++];
        const bassNotes = [-15, -20, -19, -12];
        drums.push(
            [((seed * seed * 3) * 0.5) % 2, (seed) % 2],
            [((seed * seed * 3 + seed * 9) * 0.5) % 2, (seed+1) % 2],
            [((seed * seed * 2 + seed * 11) * 0.5) % 2, (seed+1) % 2],
        );
        setProgress(prog1);
        for (let i = 0; i < 3; i++) {
            const o = i * 8;
            const q = [0,3,-5][i];
            for (let j = 0; j < 8; j++) {
                song.push([bassNotes[(seed*7+i*2+(j>>1)+j*j*3) % 4]+q, j+o, 6, 1]);
            }
            for (let j = 0; j < 8/noteSpace; j++) {
                if ((j + j*j + i+seed*3) % 7 < 4) {
                    song.push([-3+q+melodySignature[(j + j*j*2 + i*i*2+seed) % melodySignature.length], j * noteSpace + o, noteLength, 2]);
                }
            }
        }

        // Song buffer writer
        const targetBuffer = audioCtx.createBuffer(1, sampleRate * 8 * 3 * beat, sampleRate);
        const buffer = targetBuffer.getChannelData(0);
        for (let i = 0; i < song.length; i++) {
            let note, start, duration, amp;
            [note, start, duration, amp] = song[i];

            // Write note
            const baseIdx = parseInt(start * beat * sampleRate);
            const dur = duration * beat * sampleRate;
            for (let i = 0; i < dur; i++) {
                let v = 0; 
                const envelope = i / dur; 
                v+= (amp == 1) ?
                    clamp(sin(i / (6*(2**(-note/12))*2 * 2) + sin(i/8000))*(Math.exp(-envelope*23) * 44 + 1),-1,1) * 2 :
                    saw(i / (4.03 * 6*(2**(-note/12))*2)) * 7;
                buffer[baseIdx + i] += v * Math.min(envelope * Math.exp(-envelope * (10 + amp * 7)) * 100, 1) / 500;
            }
            await _yield();
            setProgress(prog1 + (prog2 - prog1) * (i/song.length) * 0.8);
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
            await _yield();
            setProgress(prog1 + (prog2 - prog1) * (0.8 + 0.2 * (q/44)));
        }
        return targetBuffer;
    }

    function play(audioBuffer) {
        return () => {
            let source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start();
        }
    };

    function onRegion(regionId) {
        music(musicRegionBuffers[regionId]);
    }

    function music(musicBuffer) {
        let audioToStop = activeMusicSource;

        activeMusicSource = audioCtx.createBufferSource();
        activeMusicSource.buffer = musicBuffer;
        activeMusicSource.loop = true;
        activeMusicSource.connect(usingA ? gainNodeA : gainNodeB);
        activeMusicSource.start();

        setTimeout(() => { audioToStop?.stop() }, 700);
        gainNodeA.gain.setTargetAtTime(usingA ? 1 : 0, audioCtx.currentTime, 0.5);
        gainNodeB.gain.setTargetAtTime(usingA ? 0 : 1, audioCtx.currentTime, 0.5);
        usingA = !usingA;
    }

    return {
        init,
    }
}

export default Audio;