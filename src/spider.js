import { renderMesh, retainTransform, scaleInPlace } from './canvas';
import { getObjectsByTag } from './engine';
import * as bus from './bus';
import { BoundingBox } from './bbox';
import { physicsCheck, groundCheck, inView, copy } from './utils';
import { EVENT_ATTACK, EVENT_ATTACK_HIT, EVENT_BONE_SPAWN } from './events';
import { TAG_ENEMY, TAG_PHYSICS } from './tags';

const legPhase = [0, 3.1, 4.7, 1.5];

function Spider(x, y, type) {
    const thickness = 5;
    const size = 1.1;
    let anim = Math.random() * 10;
    let vx = 0;
    let vy = 0;
    let targetFacing = (type > 127) ? -1 : 1;
    let walkPattern = type % 4;
    let facing = targetFacing;
    let injured = 0;
    let maxHp = 4;
    let hp = maxHp;
    let jumping = 0;
    let charging = 0;
    let needJump = false;
    let waiting = Math.random() * 3;
    
    const bboxMapOX = [-50, 0, -50, -59].map((a) => a*size/1.3);
    const bboxMapOY = [-59, -50, 0, -50].map((a) => a*size/1.3);
    const bboxMapW = [100, 60, 100, 60].map((a) => a*size/1.3);
    const bboxMapH = [60, 100, 60, 100].map((a) => a*size/1.3);
    let wa = walkPattern * 6.28 / 4;
    let modalityX = walkPattern % 2 == 0;
    let wx = Math.cos(wa);
    let wy = Math.sin(wa);
    x -= wy * 50;
    y += wx * 50;

    const enemyHitbox = BoundingBox(x,y,0,0,0,0);

    const face = [];
    for (let i = 0; i < 21; i++) {
        face.push(Math.cos(i/20*6.28) * 24, Math.sin(i/20*6.28) * 17)
    }
    const bodyMesh = [
        ['#fff', thickness, 0],
        face,
    ];
    const eyeMesh = [
        ['#000', 4, 0],
        [-7, -6, -3, -5],
        [7, -6, 3, -5],
        ['#000', 4, 3],
        [-7, 0, -3, 1],
        [7, 0, 3, 1],
        ['#000', 4, 4],
        [-7, 6, -3, 7],
        [7, 6, 3, 7],
    ];

    const legMesh = [
        ['#fff', thickness, 10],
        [6, 0],
        [-6, 0],
        ['#fff', thickness, -10],
        [6, 0],
        [-6, 0],
    ];

    function update(dT) {
        if (hp <= 0) {
            bus.off(EVENT_ATTACK, hitCheck);
            return true;
        }

        vx -= wy * 1300 * dT;
        vy += wx * 1300 * dT;

        let onGround, onRightWall, onLeftWall, onRoof;
        [x, y, onGround, onRightWall, onLeftWall, onRoof] = physicsCheck(enemyHitbox);

        [hasRight, hasLeft] = groundCheck(enemyHitbox, wx * 1.3 * size, wy * 1.3 * size);
        // TODO: optimize
        if (modalityX) {
            if (!hasRight) { targetFacing = -1; }
            if (!hasLeft) { targetFacing = 1; }
            if (onLeftWall) { targetFacing = wx; }
            if (onRightWall) { targetFacing = -wx; }
        }
        if (walkPattern == 0) {
            if (onGround && vy > 0) { vy = 0; }
        }
        if (walkPattern == 1) {
            if (onGround || !hasRight) { targetFacing = -1; }
            if (onRoof || !hasLeft) { targetFacing = 1; }
            if (onLeftWall && vx < 0) { vx = 0; }
        }
        if (walkPattern == 2) {
            if (onRoof && vy < 0) { vy = 0; }
        }
        if (walkPattern == 3) {
            if (onGround || !hasLeft) { targetFacing = 1; }
            if (onRoof || !hasRight) { targetFacing = -1; }
            if (onRightWall && vx > 0) { vx = 0; }
        }
        
        if (waiting < 0) {
            charging = 0.5;
            vx = 0;
            vy = 0;
            needJump = true;
            waiting = Math.random() * 2 + 1.5;
        }
        if (charging <= 0 && needJump) {
            jumping = 0.6;
            needJump = false;
        }
        if (jumping > 0) {
            if (modalityX) { vx = (800 * jumping + 100) * facing * wx; }
            else { vy = (800 * jumping + 100) * facing * wy; }
        }

        if (charging <= 0) {
            if (injured <= 0) {
                if (jumping <= 0) {
                    if (modalityX) { vx = 50 * facing * wx; }
                    else { vy = 50 * facing * wy; }
                }
            } else {
                if (modalityX) { vx -= vx * 12 * dT; }
                else { vy -= vy * 12 * dT; }
            }
        }

        anim += (charging > 0) ? -dT*2 : dT * (1 + jumping * 2);
        x += vx * dT;
        y += vy * dT;
        facing += (targetFacing - facing) * 8 * dT;
        injured = Math.max(0, injured - dT * 2);
        jumping = Math.max(0, jumping - dT);
        charging = Math.max(0, charging - dT);
        waiting -= dT;

        enemyHitbox.set(x, y, bboxMapOX[walkPattern], bboxMapOY[walkPattern], bboxMapW[walkPattern], bboxMapH[walkPattern]);
    }

    function render(ctx) {
        const walking = 1;

        const t = facing * 0.6;
        const a = anim * 11;
        retainTransform(() => {
            scaleInPlace(size, x, y);

            const dy = 32 + Math.cos(a);
            const dx = needJump ? (-10 + 40 * charging * charging) * facing : 0;
            const pBodyP = (Math.cos(a/2) / 15) * walking + wa + jumping * facing;

            // Leg animation
            for (let i = 0; i < 4; i++) {
                const s = i % 2 ? 1 : -1;
                const p = legPhase[i];
                const L = i < 2 ? -3 : 7;
                const idx = i < 2 ? 1 + i : 2 + i;
                legMesh[idx][2] = 11 * s - Math.cos(a+p) * 4 * facing * walking;
                legMesh[idx][3] = 12 * walking;
                legMesh[idx][4] = (40 + L) * s - Math.cos(a+p) * 2 * facing * walking;
                legMesh[idx][5] = -5 + Math.cos(a+p) * 4 * walking;
                legMesh[idx][6] = (44 + L) * s - Math.cos(a+p) * 9 * facing * walking;
                legMesh[idx][7] = 20 + Math.min(-Math.sin(a+p) * 10, 0) * walking;
            }

            if (injured > 0.2) {
                ctx.globalAlpha = Math.cos(injured*25) > 0 ? 0.2 : 1;
            }
            renderMesh(legMesh, x+21*wy, y-21*wx, 0, -t * 1.4, wa);
            renderMesh(bodyMesh, x+dy*wy+dx*wx, y-dy*wx+dx*wy, 0, t/2, t/2 + pBodyP, '#fff');
            renderMesh(eyeMesh, x+dy*wy+dx*wx, y-dy*wx+dx*wy, 17, -t, -t/2 + pBodyP, '#fff');
            ctx.globalAlpha = 1;
        });
    }

    function hitCheck([attackHitbox, dir, owner, isFlame]) {
        if (enemyHitbox.isTouching(attackHitbox) && hp > 0) {
            if (injured <= 0) {
                vx = dir * 300 * Math.abs(wx) + wy * 200;
                vy -= wx * 200;
            }
            if (jumping <= 0 && charging <= 0) {
                targetFacing = -dir;
            }
            injured = 1;
            hp -= isFlame ? 2 : 1;
            if (hp <= 0) {
                bus.emit(EVENT_BONE_SPAWN, [x+enemyHitbox.ox+enemyHitbox.w/2,y+enemyHitbox.oy+enemyHitbox.h/2,7,1]);
            }
            bus.emit(EVENT_ATTACK_HIT, [owner, isFlame ? 0 : dir]);
        }
    }

    bus.on(EVENT_ATTACK, hitCheck);

    return {
        update,
        render,
        inView: (cx, cy) => inView(x, y, cx, cy),
        order: 500,
        tags: [TAG_ENEMY],
        enemyHitbox,
    };
}

export default Spider;