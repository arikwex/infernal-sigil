import { BoundingBox } from "./bbox";
import { renderMesh, retainTransform, scaleInPlace } from "./canvas";
import { add, remove } from "./engine";
import FlameSFX from "./flame-sfx";
import * as bus from "./bus";
import { inView } from "./utils";
import { EVENT_ATTACK, EVENT_ATTACK_HIT } from "./events";

function Decoration(x, y, t) {
    let isHit = false;
    let deathTimer = 0;

    const leanAngle = Math.cos(x*x*18+y*291) * 0.1;
    let shapeMeshes = [];
    let scale = 1;
    let flip = Math.random() > 0.5 ? 1 : -1;

    // TORCH
    if (t == 0) {
        shapeMeshes.push([
            ['#445', 8, 0],
            [0, 15, 0, 0, -7, -7, 7, -7, 0, 0]
        ], [
            ['#445', 8, 0],
            [0, 50, 0, 15]
        ]);
    }
    // BONES
    if (t == 1) {
        shapeMeshes.push([
            ['#ccc', 7, 0],
            [-17, 50, -23, 14]
        ], [
            ['#ccc', 7, 0],
            [-6, 50, -11, 3]
        ], [
            ['#ccc', 7, 0],
            [5, 50, 6, -9]
        ], [
            ['#ccc', 7, 0],
            [15, 50, 19, 3]
        ]);
        scale = Math.random() * 0.5 + 0.6;
    }
    // GRASS
    if (t == 2) {
        shapeMeshes.push([
            ['#5a5', 6, 0],
            [-5, 50, -7, 20, -10, 10]
        ], [
            ['#5a5', 6, 0],
            [-10, 10, -20, 5, -30, 15, -35, 25, -25, 30]
        ], [
            ['#5a5', 6, 0],
            [5, 50, 7, 30, 10, 20]
        ], [
            ['#5a5', 6, 0],
            [10, 20, 20, 15, 25, 25, 30, 35, 20, 40]
        ]);
        scale = Math.random() * 0.5 + 0.7;
    }
    // TOTEM
    if (t == 3) {
        shapeMeshes.push([
            ['#bb8', 6, 0],
            [0, 50, 0, 10],
            [-10, 15, 10, 15],
            [-16, 40, 16, 40],
        ]);
        shapeMeshes.push([
            ['#bb8', 6, 0],
            [0, 10, 0, -20],
            [-20, -50, 0, -20, 20, -50],
            [-13, -10, 13, -10],
        ]);
        scale = Math.random() * 0.5 + 0.6;
    }
    let vx = [0, 0, 0, 0];
    let vy = [0, 0, 0, 0];
    let omega = [0, 0, 0, 0];

    let flameSfx = null;
    let myHitbox = BoundingBox(x,y,-10,-20,20,70);

    function update(dT) {
        if (isHit) {
            deathTimer += dT;
            if (deathTimer > 0.7) {
                bus.off(EVENT_ATTACK, hitCheck);
                return true;
            }
        }
    }

    function render(ctx) {
        retainTransform(() => {
            scaleInPlace(scale * flip, x, y+50, scale);
            ctx.globalAlpha = 1 - deathTimer / 0.7;
            shapeMeshes.map((shapeMesh, idx) => {
                renderMesh(
                    shapeMesh,
                    x + vx[idx] * deathTimer,
                    y + vy[idx] * deathTimer + deathTimer * deathTimer * 1200,
                    0, 0,
                    leanAngle + omega[idx] * deathTimer
                );
            });
            ctx.globalAlpha = 1;
        });
    }

    function hitCheck([attackHitbox,, owner, projectile]) {
        // Decorations do not stop projectiles
        if (!projectile && !isHit && myHitbox.isTouching(attackHitbox)) {
            bus.emit(EVENT_ATTACK_HIT, [owner]);
            isHit = true;
            shapeMeshes.map((m, idx) => {
                vx[idx] = (Math.random() - 0.5) * 250;
                vy[idx] = -Math.random() * 200 - 500;
                omega[idx] = (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1);
            });
            flameSfx?.end();
        }
    }

    if (t == 0) {
        flameSfx = FlameSFX(x, y-7, 1, Infinity);
        flameSfx.order = -6500;
        add(flameSfx);
    }
    bus.on(EVENT_ATTACK, hitCheck);

    return {
        update,
        render,
        inView: (cx, cy) => inView(x, y, cx, cy),
        order: -6000,
    }
}

export default Decoration;