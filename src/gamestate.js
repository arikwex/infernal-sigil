import { clamp } from "./utils";

let bones = 0;
let hp = 3;
let maxHp = 3;
let checkpointId = 0;

function addHp(h) { hp = clamp(hp + h, 0, maxHp); }
function getHp() { return hp; }
function getMaxHp() { return maxHp; }
function addBones(b) { bones = Math.max(bones + b, 0); }
function getBones() { return bones; }
function respawn() { bones = bones>>1; hp = maxHp; }
function setCheckpointId(id) { checkpointId = id; hp = maxHp; }
function getCheckpointId() { return checkpointId; }

export {
    addHp,
    getHp,
    getMaxHp,
    addBones,
    getBones,
    setCheckpointId,
    getCheckpointId,
    respawn,
}