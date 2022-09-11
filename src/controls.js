import * as bus from './bus';
import { EVENT_ANY_KEY } from './events';

const pressed = {};

const GAMEPAD_BUTTON_MAP = {
    0: 'PadSouth',
    1: 'PadEast',
    2: 'PadWest',
    3: 'PadNorth',
    4: 'PadLBumper',
    6: 'PadLTrigger',
    12: 'DPadUp',
    13: 'DPadDown',
    14: 'DPadLeft',
    15: 'DPadRight',
}

function updateGameControls() {
    const gp = getGamePad();
    if (!gp) { return; }
    Object.entries(GAMEPAD_BUTTON_MAP).map(([btn, code]) => mapPadToKey(gp?.buttons[btn], code));
}

// KEYBOARD
onkeydown = (evt) => {
    if (!pressed[evt.code]) {
        pressed[evt.code] = Date.now();
    }
    bus.emit(EVENT_ANY_KEY);
}

onkeyup = (evt) => delete pressed[evt.code];

// GAMEPAD
let currentGamePadId = 0;
window.addEventListener('gamepadconnected', (e) => {
    currentGamePadId = e.gamepad.index;
});

function getGamePad() { return navigator.getGamepads()[currentGamePadId]; }
function mapPadToKey(button, keyname) {
    if (!pressed[keyname] && button?.value > 0.5) { onkeydown({ code: keyname }); }
    if (pressed[keyname] && button?.value < 0.5) { onkeyup({ code: keyname }); }
}

let horizontal = () =>
    ((pressed['ArrowLeft'] || pressed['KeyA'] || getGamePad()?.axes[0] < -0.4 || pressed['DPadLeft']) ? -1 : 0) + 
    ((pressed['ArrowRight'] || pressed['KeyD'] || getGamePad()?.axes[0] > 0.4 || pressed['DPadRight']) ? 1 : 0);
let vertical = () => 
    ((pressed['ArrowUp'] || pressed['KeyW']  || getGamePad()?.axes[1] < -0.4 || pressed['DPadUp']) ? 1 : 0) + 
    ((pressed['ArrowDown'] || pressed['KeyS'] || getGamePad()?.axes[1] > 0.4 || pressed['DPadDown']) ? -1 : 0);
let recent = (f) => (Date.now() - pressed[f]) < 100;
let jump = () => recent('KeyZ') || recent('Space') || recent('PadSouth');
let attack = () => recent('KeyX') || recent('KeyJ') || recent('PadWest');
let dash = () => recent('KeyC') || recent('KeyK') || recent('PadEast') || recent('PadLTrigger');
let ignite = () => recent('KeyV') || recent('KeyL') || recent('PadNorth');
let holdingJump = () => pressed['KeyZ'] || pressed['Space'] || pressed['PadSouth'];
let holdingMap = () => pressed['KeyM'] || pressed['KeyN'] || pressed['PadLBumper'];

export {
    updateGameControls,
    horizontal,
    vertical,
    jump,
    attack,
    ignite,
    dash,
    holdingJump,
    holdingMap,
}