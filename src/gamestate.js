import { clamp } from "./utils";

function GameState() {
    let bones = 0;
    let hp = 3;
    let maxHp = 3;

    function addHp(h) { hp = clamp(hp + h, 0, maxHp); }
    function getHp() { return hp; }
    function getMaxHp() { return maxHp; }
    function addBones(b) { bones = Math.max(bones + b, 0); }
    function getBones() { return bones; }

    return {
        addHp,
        getHp,
        getMaxHp,
        addBones,
        getBones,
    }
}

let currentGameState = new GameState();
function getCurrentGameState() {
    return currentGameState;
}

export {
    GameState,
    getCurrentGameState,
}