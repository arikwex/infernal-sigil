import * as bus from './bus';
import { BoundingBox } from "./bbox"
import { renderMesh } from "./canvas";
import { getObjectsByTag } from "./engine";

function Bone(x, y, vx, vy) {
    let anim = Math.random() * 7;
    let phase = Math.random() * 7;

    const collectHitbox = new BoundingBox(x,y,1,1);
    const boneMesh = [
        ['#fff', 6, 0],
        [-11, -7, -7, -7, 7, 7, 7, 11],
        [-7, -11, -7, -7, 7, 7, 11, 7],
    ];

    function update(dT) {
        anim += dT;
        vy += 2000 * dT;

        let onGround = false;
        getObjectsByTag('physics').map(({ physics }) => {
            if (collectHitbox.isTouching(physics)) {
                // Sides
                if (y - 16 < physics.y + physics.h && y - 16 > physics.y) {
                    if (x-10 < physics.x) {
                        x = physics.x - 15;
                        vx = -vx;
                        targetFacing = -1;
                        return;
                    }
                    if (x+10 > physics.x + physics.w) {
                        x = physics.x + physics.w + 15;
                        vx = -vx;
                        targetFacing = 1;
                        return;
                    }
                }
                // Falling to hit top of surface
                if (y - 45 < physics.y) {
                    vy = (vy > 300) ? -0.4*vy : 0;
                    vx *= 0.7;
                    y = physics.y - 19.9;
                    onGround = true;
                }
                // Hit head on bottom of surface
                if ((y - 15 > physics.y + physics.h) && (vy < -100 || state == 3)) {
                    vy = 0;
                    y = physics.y + physics.h + 20;
                }
            }
        });

        if (onGround) {
            vx -= vx * 9.0 * dT;
        }

        let collected = false;
        getObjectsByTag('player').map(({ playerHitbox }) => {
            if (collectHitbox.isTouching(playerHitbox)) {
                collected = true;
            }
        });
        if (collected) {
            bus.emit('bone:collect', 1);
            return true;
        }

        x += vx * dT;
        y += vy * dT;
        collectHitbox.set(x-15,y-20,30,40);
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