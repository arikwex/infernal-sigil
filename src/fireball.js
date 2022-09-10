import * as bus from './bus';
import { BoundingBox } from "./bbox";
import { color, renderMesh } from "./canvas";
import { clamp, physicsCheck } from "./utils";
import { EVENT_ATTACK, EVENT_ATTACK_HIT, EVENT_SFX_FLAME } from './events';
import FlameSFX from './flame-sfx';
import { add, remove } from './engine';

function Fireball(x, y, dir) {
    let vx = 300 * dir;
    x += dir * 40;
    let self = this;
    let lifetime = 0;
    let flame = FlameSFX(x, y, 2, 10, dir * 1.57);
    add(flame);

    const myHitbox = BoundingBox(x, y, -20, -15, 30, 30);

    function update(dT) {
        lifetime += dT;
        if (!self || lifetime > 9) {
            bus.off(EVENT_ATTACK_HIT, onAttackHit);
            flame.end();
            return true;
        }
        // TBD if this can be less aggressive
        bus.emit(EVENT_ATTACK, [myHitbox, dir, self, true]);
        let _, onGround, onRight, onLeft, onRoof;
        [_, _, onGround, onRight, onLeft, onRoof] = physicsCheck(myHitbox);
        if (onGround || onRight || onLeft || onRoof) {
            bus.off(EVENT_ATTACK_HIT, onAttackHit);
            flame.end();
            return true;
        }
        vx = clamp(vx + 1000 * dT * dir, -750, 750);
        x += vx * dT;
        myHitbox.x = x;
        flame.set(x);
    }

    function onAttackHit([owner]) {
        if (owner == self) {
            self = null;
        }
    }

    bus.on(EVENT_ATTACK_HIT, onAttackHit);

    return {
        update,
    }
}

export default Fireball;