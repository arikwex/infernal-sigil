import * as bus from './bus';
import { EVENT_ANY_KEY } from './events';

const pressed = {};

onkeydown = (evt) => {
    if (!pressed[evt.code]) {
        pressed[evt.code] = Date.now();
    }
    bus.emit(EVENT_ANY_KEY);
}

onkeyup = (evt) => delete pressed[evt.code];

let horizontal = () => (pressed['ArrowLeft'] ? -1 : 0) + (pressed['ArrowRight'] ? 1 : 0);
let vertical = () => (pressed['ArrowUp'] ? 1 : 0) + (pressed['ArrowDown'] ? -1 : 0);
let recent = (f) => (Date.now() - pressed[f]) < 100;
let jump = () => recent('KeyZ');
let attack = () => recent('KeyX');
let dash = () => recent('KeyC');
let ignite = () => recent('KeyV');
let holdingJump = () => pressed['KeyZ'];
let holdingMap = () => pressed['KeyM'];

export {
    horizontal,
    vertical,
    jump,
    attack,
    ignite,
    dash,
    holdingJump,
    holdingMap,
}