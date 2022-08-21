import * as bus from './bus';

const pressed = {};

window.onkeydown = (evt) => {
    pressed[evt.code] = true;
}

window.onkeyup = (evt) => {
    delete pressed[evt.code];
}

function horizontal() {
    return (pressed['ArrowLeft'] ? -1 : 0) + (pressed['ArrowRight'] ? 1 : 0);
}

// function vertical() {
//     return (pressed['ArrowUp'] ? -1 : 0) + (pressed['ArrowRight'] ? 1 : 0);
// }

export {
    horizontal
}