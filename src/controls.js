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

let horizontal = () => ((pressed['ArrowLeft'] || pressed['KeyA']) ? -1 : 0) + ((pressed['ArrowRight'] || pressed['KeyD']) ? 1 : 0);
let vertical = () => ((pressed['ArrowUp'] || pressed['KeyW']) ? 1 : 0) + ((pressed['ArrowDown'] || pressed['KeyS']) ? -1 : 0);
let recent = (f) => (Date.now() - pressed[f]) < 100;
let jump = () => recent('KeyZ') || recent('Space');
let attack = () => recent('KeyX') || recent('KeyJ');
let dash = () => recent('KeyC') || recent('KeyK');
let ignite = () => recent('KeyV') || recent('KeyL');
let holdingJump = () => pressed['KeyZ'] || pressed['Space'];
let holdingMap = () => pressed['KeyM'] || pressed['KeyN'];

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