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
    const win = (i, ts, te) => {
        if (i < ts * 44100 || i > te * 44100) { return 0; }
        return 1 - ((i / 44100) - ts) / (te - ts);
    }

    var generate = (duration, fn, fading = true) => {
        var audioBuffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        var buffer = audioBuffer.getChannelData(0);
        var N = audioBuffer.length;
        var anim = 0;
        for (var i = 0; i < N; i++) {
            var p = i / N;
            var envelope = 1 - p;
            if (!fading) { envelope = 1; }
            buffer[i] = fn(i * 44100 / sampleRate) * envelope;
        }
        return audioBuffer;
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
    };
    bus.on('any', enable);

    //   var musicSource = null;
    //   this.music = () => {
    //     if (audioCtx == null) { this.init(); }
    //     musicSource = audioCtx.createBufferSource();
    //     musicSource.buffer = musicBuffer;
    //     musicSource.loop = true;
    //     musicSource.connect(audioCtx.destination);
    //     musicSource.start();
    //   };

    //   this.stopMusic = () => {
    //     try {
    //       if (musicSource != null) { musicSource.stop(); }
    //     } catch (e) {}
    //   }
}

export default Audio;