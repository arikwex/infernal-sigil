import * as bus from './bus';
import { BoundingBox } from "./bbox"
import { color, renderMesh } from "./canvas";
import { getObjectsByTag } from "./engine";
import { physicsCheck } from './utils';

function Bone(x, y, vx, vy) {
    let anim = Math.random() * 7;
    let phase = Math.random() * 7;
    let popOut = 0;
    let collected = false;
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

        let onGround, onRightWall, onLeftWall, onRoof;
        [x, y, onGround, onRightWall, onLeftWall, onRoof] = physicsCheck(getObjectsByTag('physics'), collectHitbox);
        if (onRightWall || onLeftWall) { vx = -vx; }
        if (onGround) { 
            vy = (vy > 300) ? -0.4 * vy : 0;
            vx -= vx * 9.0 * dT;
        }
        if (onRoof) { vy = 0; }
        
        if (!collected) {
            getObjectsByTag('player').map(({ playerHitbox }) => {
                if (collectHitbox.isTouching(playerHitbox) && lifeTime > 0.25) {
                    collected = true;
                    bus.emit('bone:collect', 1);
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
            ctx.arc(x,y,popOut*40+10,0,6.28);
            ctx.fill();
        } else {
            renderMesh(boneMesh, x, y, 0, t, p);
        }
    }

    return {
        update,
        render,
        collectHitbox
    }
}

export default Bone;