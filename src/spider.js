import { renderMesh, scaleInPlace } from './canvas';
import { getObjectsByTag } from './engine';
import * as bus from './bus';
import { BoundingBox } from './bbox';
import { physicsCheck, groundCheck } from './utils';

const legPhase = { 0: 0, 1: 3.1, 2: 4.7, 3: 1.5};

function Spider(x, y, type) {
    const thickness = 5;
    const size = 1.3;
    let anim = Math.random() * 10;
    let vx = 0;
    let vy = 0;
    let targetFacing = (type > 127) ? -1 : 1;
    let facing = targetFacing;
    let injured = 0;
    let maxHp = 3;
    let hp = maxHp;
    const enemyHitbox = new BoundingBox(x,y,0,0,0,0);

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

        vy += 1400 * dT;

        let onGround, onRightWall, onLeftWall, onRoof;
        [x, y, onGround, onRightWall, onLeftWall, onRoof] = physicsCheck(getObjectsByTag('physics'), enemyHitbox);
        [hasRight, hasLeft] = groundCheck(getObjectsByTag('physics'), enemyHitbox);
        if (onGround && vy > 500) { hp = 0; bus.emit('bone:spawn', [x,y-55,4,1]); }
        if (onRightWall || (!hasRight && onGround)) { targetFacing = -1; }
        if (onLeftWall || (!hasLeft && onGround)) { targetFacing = 1; }
        if (onGround || onRoof) { vy = 0; }

        if (injured <= 0 && onGround) {
            vx = 160 * facing;
            if (Math.random > 0.98) {
                targetFacing = -targetFacing;
            }
        }

        if (injured > 0) {
            vx -= vx * 12 * dT;
        }

        anim += dT;
        x += vx * dT;
        y += vy * dT;
        facing += (targetFacing - facing) * 8 * dT;
        injured = Math.max(0, injured - dT * 2);

        enemyHitbox.set(x, y, -20, -59, 40, 60);
    }

    function render(ctx) {
        const idle = 0;
        const walking = 1;

        const t = facing * 0.6;//-0.6;//Math.cos(Date.now() / 1000) * 0.6;//facing * 0.6;
        const a = anim * 16;
        const xfm = ctx.getTransform();
        scaleInPlace(size, x, y);

        const dy = Math.cos(a) * 1;
        const pBodyP = (Math.cos(a/2) / 15) * walking;
        const pHand1X = 7 * t * (idle + walking) + pBodyP * 50;
        const pHand1Y =
            (-33 - 2 * t + Math.cos(a)) * idle +
            (-33 - 2 * t + Math.cos(a-1)) * walking;
        const pHand2X = 7 * t * (idle + walking) + pBodyP * 50;
        const pHand2Y =
            (-33 + 2 * t + Math.cos(a)) * idle +
            (-33 + 2 * t + Math.cos(a+2)) * walking;
        const pHeadY = (-40 + Math.cos(a+1)) * (idle + walking);

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
        renderMesh(legMesh, x, y-21, 0, -t * 1.4, 0);
        // renderMesh(handMesh, x + pHand1X, y + pHand1Y, -4, t * 2.1, -t/3);
        // renderMesh(handMesh, x + pHand2X, y + pHand2Y, 4, t * 2.1 + 3.14, -t/3);
        renderMesh(bodyMesh, x, y-32+dy, 0, t/2, t/2 + pBodyP, '#fff');
        renderMesh(eyeMesh, x, y-32+dy, 17, -t, -t/2 + pBodyP, '#fff');
        // renderMesh(headMesh, x, y + pHeadY, 23 + pBodyP * 70 * facing, -t, -injured * facing * 0.6);
        ctx.globalAlpha = 1;
        ctx.setTransform(xfm);
    }

    function hitCheck([attackHitbox, dir, owner]) {
        if (enemyHitbox.isTouching(attackHitbox) && hp > 0) {
            vx = dir * 600;
            targetFacing = -Math.sign(dir);
            injured = 1;
            hp -= 1;
            if (hp <= 0) {
                bus.emit('bone:spawn', [x,y-55,4,1]);
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