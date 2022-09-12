import * as bus from './bus';
import { retainTransform, scaleInPlace } from './canvas';
import { renderMesh } from './canvas';
import { BoundingBox } from './bbox';
import { copy, inView } from './utils';
import { EVENT_ATTACK, EVENT_ATTACK_HIT, EVENT_BONE_SPAWN } from './events';
import { treasureMeshAsset } from './assets';
import { foundTreasure, getTotalNumTreasure, setTotalNumTreasure } from './gamestate';
import { getObjectsByTag } from './engine';
import { TAG_MAP } from './tags';

// Bone Values -> 20, 50, 100
// Hp -> 3, 6, 9 (1 bone each)

function Treasure(x, y, t) {
    y += 50;
    let hitTimer = 0;
    let phase = 0;
    let hp = 3 * t;
    const myHitbox = BoundingBox(x-25,y-55,0,0,50,55);
    setTotalNumTreasure(getTotalNumTreasure() + 1);

    const baseColor = ['#a63', '#889', '#db1'][t-1];
    const bgColor = ['#742', '#667', '#b90'][t-1];
    const treasureMesh = copy(treasureMeshAsset);
    treasureMesh[0][0] = baseColor;
    
    function update(dT) {
        if (hp <= 0) {
            bus.emit(EVENT_BONE_SPAWN, [x,y-20, [7, 14, 11][t-1], 1]);
            bus.emit(EVENT_BONE_SPAWN, [x,y-20, [1, 3, 7][t-1], 2]);
            bus.off(EVENT_ATTACK, hitCheck);
            foundTreasure();
            getObjectsByTag(TAG_MAP)[0].d(parseInt(x/100), parseInt(y/100), null);
            return true;
        }
        hitTimer = Math.max(hitTimer - dT, 0);
    }

    function render() {
        retainTransform(() => {
            scaleInPlace(0.75 + t * 0.15, x, y);
            renderMesh(treasureMesh, 
                x,
                y - 2 - Math.abs(Math.cos(hitTimer * 20) * 12) * Math.exp(hitTimer * 6 - 3) / 10, 
                0, 0, Math.cos(hitTimer * 30 + phase) * hitTimer * Math.exp(hitTimer * 6 - 3) / 60, bgColor
            );
        });
    }

    function hitCheck([attackHitbox,, owner]) {
        if (myHitbox.isTouching(attackHitbox)) {
            hitTimer = 1;
            phase = Math.random() * 7;
            hp -= 1;
            bus.emit(EVENT_BONE_SPAWN, [x,y-20,1,1]);
            bus.emit(EVENT_ATTACK_HIT, [owner]);
        }
    }

    bus.on(EVENT_ATTACK, hitCheck);

    return {
        update,
        render,
        inView: (cx, cy) => inView(x, y, cx, cy),
        order: -6000,
    }
}

export default Treasure;