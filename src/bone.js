import * as bus from './bus';
import { BoundingBox } from "./bbox"
import { color, renderMesh } from "./canvas";
import { getObjectsByTag } from "./engine";
import { copy, physicsCheck } from './utils';
import { boneMeshAsset } from './assets';

// t=1 -> value = 1
// t=2 -> value = 10
function Bone(x, y, vx, vy, t=1) {
    let anim = Math.random() * 7;
    let phase = Math.random() * 7;
    let popOut = 0;
    let collected = false;
    let lifeTime = 0;
    let vanish = 10 + Math.random() * 3;
    let offset = -15 + 20 * Math.random();

    const collectHitbox = new BoundingBox(x,y,1,1);
    let boneMesh;
    if (t == 1) {
        boneMesh = copy(boneMeshAsset);
    } else {
        boneMesh = [
            ['#fff', 9, 0],
            [3, 10, -3, 10, -3, 0, -6, -4, 0, -10, 6, -4, 3, 0, 3, 10],
            ['#000', 4, 5],
            [-5, -6, -3, -5],
            [5, -6, 3, -5],
        ];
    }

    function update(dT) {
        anim += dT;
        lifeTime += dT;
        vy += 2000 * dT;
        if (lifeTime > vanish) {
            collected = true;
        }

        let onGround, onRightWall, onLeftWall, onRoof;
        [x, y, onGround, onRightWall, onLeftWall, onRoof] = physicsCheck(getObjectsByTag('physics'), collectHitbox);
        if (onRightWall || onLeftWall) { vx = -vx; }
        if (onGround) {
            if (vy > 200) {
                bus.emit('bone:dink');
                vy *= -0.4;
            } else {
                vy = 0;
            }
            vx -= vx * 9.0 * dT;
        }
        if (onRoof) { vy = 0; }

        if (!collected) {
            getObjectsByTag('player').map(({ playerHitbox }) => {
                if (collectHitbox.isTouching(playerHitbox) && lifeTime > 0.35) {
                    collected = true;
                    bus.emit('bone:collect', 9 * t - 8);
                }
            });
        } else {
            popOut += 3 * dT;
        }

        if (popOut > 0.5) {
            return true;
        }

        x += vx * dT;
        y += vy * dT;
        collectHitbox.set(x, y, -15, -20, 30, 40);
    }

    function render(ctx) {
        const t = anim * 3;
        const p = Math.cos(anim + phase) * 0.2 + phase;
        if (collected) {
            color(`rgba(255, 255, 180, ${1 - popOut * 2})`);
            ctx.beginPath();
            ctx.arc(x,y + offset,popOut*40+10,0,6.28);
            ctx.fill();
        } else {
            renderMesh(boneMesh, x, y + offset, 0, t, p);
        }
    }

    return {
        update,
        render,
        collectHitbox
    }
}

export default Bone;