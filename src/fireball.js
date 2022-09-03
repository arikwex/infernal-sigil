import * as bus from './bus';
import { BoundingBox } from "./bbox";
import { color, renderMesh } from "./canvas";
import { getObjectsByTag } from "./engine";
import { clamp, physicsCheck } from "./utils";

function Fireball(x, y, dir) {
    let vx = 300 * dir;
    x += dir * 40;
    let self = this;
    let lifetime = 0;

    const ballMesh = [
        ['#fb1', 10, 0],
        [10, 0, 0, -10, -10, 0, -15, -5, -20, 0, -28, 0, -20, 0, -15, 5, -10, 0, 0, 10, 10, 0],
        ['#f82', 10, 0],
        [2, 0, -4, 0],
    ];
    const myHitbox = new BoundingBox(x, y, -20, -15, 30, 30);

    function update(dT) {
        lifetime += dT;
        if (!self || lifetime > 9) {
            return true;
        }
        // TBD if this can be less aggressive
        bus.emit('attack', [myHitbox, dir, self, true]);
        let _, onGround, onRight, onLeft, onRoof;
        [_, _, onGround, onRight, onLeft, onRoof] = physicsCheck(getObjectsByTag('physics'), myHitbox);
        if (onGround || onRight || onLeft || onRoof) {
            bus.emit('sfx:flame', [x, y, 2, 0.5]);
            return true;
        }
        vx = clamp(vx + 1000 * dT * dir, -750, 750);
        x += vx * dT;
        myHitbox.x = x;
    }

    function render(ctx) {
        color('#fb1');
        ctx.beginPath();
        const t = Date.now();
        const p = (t % 100) / 100;
        let s = (p - p * p) * 40;
        ctx.arc(x - (5 + p * 42) * dir, y + Math.cos(t/20)*4, s, 0, 6.28);
        ctx.fill();
        renderMesh(ballMesh, x, y, 0, 0, dir * 1.57 - 1.57);
    }

    function onAttackHit([owner]) {
        if (owner == self) {
            self = null;
        }
    }

    function enable() {
        bus.on('attack:hit', onAttackHit);
    }

    function disable() {
        bus.off('attack:hit', onAttackHit);
    }

    return {
        update,
        render,
        enable,
        disable,
    }
}

export default Fireball;