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

function jump() {
    return (Date.now() - pressed['ArrowUp']) < 100;
}

function holdingJump() {
    return pressed['ArrowUp'];
}

export {
    horizontal,
    jump,
    holdingJump,
}