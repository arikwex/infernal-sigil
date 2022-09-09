import { clamp } from "./utils";

let bones = 0;
let hp = 3;
let checkpointId = 0;
let deathCount = 0;

function addHp(h) { hp = clamp(hp + h, 0, 3); }
function getHp() { return hp; }
function getMaxHp() { return 3; }
function addBones(b) { bones = Math.max(bones + b, 0); }
function getBones() { return bones; }
function respawn() { bones = bones>>1; hp = 3; deathCount++; }
function setCheckpointId(id) { checkpointId = id; hp = 3; }
function getCheckpointId() { return checkpointId; }
function getDeathCount() { return deathCount; }

export {
    addHp,
    getHp,
    getMaxHp,
    addBones,
    getBones,
    setCheckpointId,
    getCheckpointId,
    getDeathCount,
    respawn,
}