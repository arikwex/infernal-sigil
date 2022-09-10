import { clamp } from "./utils";

let bones = 0;
let hp = 3;
let checkpointId = 0;
let deathCount = 0;
let treasures = 0;

function addHp(h) { hp += h; }
function getHp() { return hp; }
function addBones(b) { bones = Math.max(bones + b, 0); }
function getBones() { return bones; }
function respawn() { bones = bones>>1; hp = 3; deathCount++; }
function setCheckpointId(id) { checkpointId = id; hp = 3; }
function getCheckpointId() { return checkpointId; }
function getDeathCount() { return deathCount; }
function foundTreasure() { treasures += 1; }
function getTreasures() { return treasures; }

export {
    addHp,
    getHp,
    addBones,
    getBones,
    setCheckpointId,
    getCheckpointId,
    getDeathCount,
    foundTreasure,
    getTreasures,
    respawn,
}