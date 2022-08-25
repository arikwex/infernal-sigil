import * as bus from './bus';
import { BoundingBox } from "./bbox"
import { renderMesh } from "./canvas";
import { getObjectsByTag } from "./engine";
import { physicsCheck } from './utils';

function Bone(x, y, vx, vy) {
    let anim = Math.random() * 7;
    let phase = Math.random() * 7;
    let lifeTime = 0;

    const collectHitbox = new BoundingBox(x,y,1,1);
    const boneMesh = [
        ['#fff', 6, 0],
        [-11, -7, -7, -7, 7, 7, 7, 11],
        [-7, -11, -7, -7, 7, 7, 11, 7],
    ];

    function update(dT) {
        anim += dT;
        lifeTime += dT;
        vy += 2000 * dT;

        [x, y, onGround, onRightWall, onLeftWall, onRoof] = physicsCheck(getObjectsByTag('physics'), collectHitbox);
        if (onRightWall || onLeftWall) { vx = -vx; }
        if (onGround) { 
            vy = (vy > 300) ? -0.4 * vy : 0;
            vx -= vx * 9.0 * dT;
        }
        if (onRoof) { vy = 0; }

        let collected = false;
        getObjectsByTag('player').map(({ playerHitbox }) => {
            if (collectHitbox.isTouching(playerHitbox) && lifeTime > 0.65) {
                collected = true;
            }
        });
        if (collected) {
            bus.emit('bone:collect', 1);
            return true;
        }

        x += vx * dT;
        y += vy * dT;
        collectHitbox.set(x, y, -15, -20, 30, 40);
    }

    function render(ctx) {
        const t = anim * 3;
        const p = Math.cos(anim + phase) * 0.2 + phase;
        renderMesh(boneMesh, x, y, 0, t, p);
    }

    return {
        update,
        render,
        collectHitbox
    }
}

export default Bone;