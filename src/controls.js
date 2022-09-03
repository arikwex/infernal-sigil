import * as bus from './bus';

const pressed = {};

window.onkeydown = (evt) => {
    if (!pressed[evt.code]) {
        pressed[evt.code] = Date.now();
    }
}

window.onkeyup = (evt) => {
    delete pressed[evt.code];
}

function horizontal() {
    return (pressed['ArrowLeft'] ? -1 : 0) + (pressed['ArrowRight'] ? 1 : 0);
}

function vertical() {
    return (pressed['ArrowUp'] ? 1 : 0) + (pressed['ArrowDown'] ? -1 : 0);
}

function jump() {
    return (Date.now() - pressed['KeyZ']) < 100;
}

function attack() {
    return (Date.now() - pressed['KeyX']) < 100;
}

function dash() {
    return (Date.now() - pressed['KeyC']) < 100;
}

function ignite() {
    return (Date.now() - pressed['KeyV']) < 100;
}

function holdingJump() {
    return pressed['KeyZ'];
}

export {
    horizontal,
    vertical,
    jump,
    attack,
    ignite,
    dash,
    holdingJump,
}