import { renderMesh, scaleInPlace } from './canvas';
import { getObjectsByTag } from './engine';
import * as bus from './bus';
import { BoundingBox } from './bbox';
import { physicsCheck, groundCheck } from './utils';

const legPhase = [0, 3.1, 4.7, 1.5];
const bboxMapOX = [-50, 0, -50, -59];
const bboxMapOY = [-59, -50, 0, -50];
const bboxMapW = [100, 60, 100, 60];
const bboxMapH = [60, 100, 60, 100];

function Spider(x, y, type) {
    type = 3;
    const thickness = 5;
    const size = 1.3;
    let anim = Math.random() * 10;
    let vx = 0;
    let vy = 0;
    let targetFacing = (type > 127) ? -1 : 1;
    let facing = targetFacing;
    let injured = 0;
    let maxHp = 5;
    let hp = maxHp;
    
    let wa = type * 6.28 / 4;
    let wx = Math.cos(wa);
    let wy = Math.sin(wa);
    x -= wy * 50;
    y += wx * 50;

    const enemyHitbox = new BoundingBox(x,y,0,0,0,0);
    enemyHitbox.debug = true;

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
        [6, 0, 11, 12, 40, -5, 44, 20],
        [-6, 0, -11, 12, -40, -5, -44, 20],
        ['#fff', thickness, -10],
        [6, 0, 11, 12, 46, -10, 50, 20],
        [-6, 0, -11, 12, -46, -10, -50, 20],
    ];

    function update(dT) {
        if (hp <= 0) {
            return true;
        }

        vx -= wy * 800 * dT;
        vy += wx * 800 * dT;

        let onGround, onRightWall, onLeftWall, onRoof;
        [x, y, onGround, onRightWall, onLeftWall, onRoof] = physicsCheck(getObjectsByTag('physics'), enemyHitbox);

        [hasRight, hasLeft] = groundCheck(getObjectsByTag('physics'), enemyHitbox, wx * 1.8, wy * 1.8);
        if (type == 0) {
            if (onRightWall || !hasRight) { targetFacing = -1; }
            if (onLeftWall || !hasLeft) { targetFacing = 1; }
            if (onGround || onRoof) { vy = 0; }
        }
        if (type == 1) {
            if (onGround || !hasRight) { targetFacing = -1; }
            if (onRoof || !hasLeft) { targetFacing = 1; }
            if (onRightWall || onLeftWall) { vx = 0; }
        }
        if (type == 2) {
            if (onRightWall || !hasLeft) { targetFacing = 1; }
            if (onLeftWall || !hasRight) { targetFacing = -1; }
            if (onGround || onRoof) { vy = 0; }
        }
        if (type == 3) {
            if (onGround || !hasLeft) { targetFacing = 1; }
            if (onRoof || !hasRight) { targetFacing = -1; }
            if (onRightWall || onLeftWall) { vx = 0; }
        }
        

        if (injured <= 0) {
            if (type % 2 == 0) { vx = 160 * facing * wx; }
            if (type % 2 == 1) { vy = 160 * facing * wy; }
        } else {
            vx -= vx * 12 * dT;
            vy -= vy * 12 * dT;
        }

        anim += dT;
        x += vx * dT;
        y += vy * dT;
        facing += (targetFacing - facing) * 8 * dT;
        injured = Math.max(0, injured - dT * 2);

        enemyHitbox.set(x, y, bboxMapOX[type], bboxMapOY[type], bboxMapW[type], bboxMapH[type]);
    }

    function render(ctx) {
        const idle = 0;
        const walking = 1;

        const t = facing * 0.6;
        const a = anim * 16;
        const xfm = ctx.getTransform();
        scaleInPlace(size, x, y);

        const dy = 32 + Math.cos(a);
        const pBodyP = (Math.cos(a/2) / 15) * walking + wa;

        // Leg animation
        for (let i = 0; i < 4; i++) {
            const s = i % 2 ? 1 : -1;
            const p = legPhase[i];
            const L = i < 2 ? -3 : 7;
            const idx = i < 2 ? 1 + i : 2 + i;
            legMesh[idx][2] = (11 * s - Math.cos(a+p) * 4 * facing) * walking;
            legMesh[idx][3] = (12) * walking;
            legMesh[idx][4] = ((40 + L) * s - Math.cos(a+p) * 2 * facing) * walking;
            legMesh[idx][5] = (-5 + Math.cos(a+p) * 4) * walking;
            legMesh[idx][6] = ((44 + L) * s - Math.cos(a+p) * 9 * facing) * walking;
            legMesh[idx][7] = (20 + Math.min(-Math.sin(a+p) * 10, 0)) * walking;
        }

        if (injured > 0.2) {
            ctx.globalAlpha = Math.cos(injured*25) > 0 ? 0.2 : 1;
        }
        renderMesh(legMesh, x+21*wy, y-21*wx, 0, -t * 1.4, wa);
        renderMesh(bodyMesh, x+dy*wy, y-dy*wx, 0, t/2, t/2 + pBodyP, '#fff');
        renderMesh(eyeMesh, x+dy*wy, y-dy*wx, 17, -t, -t/2 + pBodyP, '#fff');
        ctx.globalAlpha = 1;
        ctx.setTransform(xfm);
    }

    function hitCheck([attackHitbox, dir, owner]) {
        if (enemyHitbox.isTouching(attackHitbox) && hp > 0) {
            vx = dir * 300;
            vy = -targetFacing * 300;
            targetFacing = -targetFacing;
            injured = 1;
            hp -= 1;
            if (hp <= 0) {
                bus.emit('bone:spawn', [x+enemyHitbox.ox+enemyHitbox.w/2,y+enemyHitbox.oy+enemyHitbox.h/2,9,1]);
            }
            bus.emit('attack:hit', [owner]);
        }
    }

    function enable() {
        bus.on('attack', hitCheck);
    }

    function disable() {
        bus.off('attack', hitCheck);
    }

    return {
        update,
        render,
        enable,
        disable,
        order: 500,
        tags: ['enemy'],
        enemyHitbox,
    };
}

export default Spider;