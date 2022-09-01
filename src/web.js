import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";
import * as bus from './bus';

function Web(x, y) {
    y -= 50;
    let burnup = false;
    let burntime = 0;
    let anim = 0;
    let cx = 0;
    let cy = 0;
    let omx = 0;
    let omy = 0;
    const webMesh = [
        ['#fff', 4, 0]
    ];
    // build a procedural web
    const angles = [];
    const rads = [];
    for (let i = 0; i < 8; i++) {
        let a = -2.3 + (Math.random() - 0.5)/4 + (i%4)/2;
        if (i > 3) { a += 3.14; }
        const R = 110 / Math.abs(Math.sin(a));
        angles.push(a);
        rads.push(R);
        webMesh.push([0, 0, Math.cos(a) * R, Math.sin(a) * R]);
    }
    const webbing = new Array(64);
    webMesh.push(webbing);
    const physics = new BoundingBox(x-50, y-100, 0, 0, 100, 200);

    function update(dT) {
        anim += dT * 56;
        omx -= omx * 5 * dT;
        omy -= omy * 5 * dT;
        cx = omx * Math.cos(anim);
        cy = omy * Math.cos(anim / 1.4);
        updateWebPos();

        if (burnup) {
            burntime += dT;
            if (burntime > 1) {
                return true;
            }
        }
    }

    function render(ctx) {
        if (burnup) {
            // Darken
            const p = 1-burntime;
            const w = Math.max(255 - 1000 * burntime, 0);
            webMesh[0][0] = `rgba(${w},${w},${w},${p})`;
        }
        renderMesh(webMesh, x, y, 0, 0, 0);
    }

    function updateWebPos() {
        for (let i = 0; i < 8; i++) {
            webMesh[1 + i][0] = cx;
            webMesh[1 + i][1] = cy;
        }
        for (let i = 0; i < 32; i++) {
            const a = angles[i % 8];
            const p = (i / 70 + 0.07) / (1 - Math.abs(Math.sin(a)) * 0.5);
            const r = rads[i % 8] * p;
            webbing[i*2] = Math.cos(a) * r + cx * (1 - p);
            webbing[i*2+1] = Math.sin(a) * r + cy * (1 - p);
        }
    }

    function hitCheck([attackHitbox, dir, owner, flames]) {
        if (physics.isTouching(attackHitbox)) {
            omx = 10;
            omy = 8;
            if (flames && !burnup) {
                burnup = true;
                // Flames
                for (let i = 0; i < 18; i++) {
                    setTimeout(() => {
                        bus.emit('sfx:flame', [
                            x + (Math.random() - 0.5) * 170,
                            y + (Math.random() - 0.5) * 190 + 20,
                            Math.random() * 1 + 1,
                            Math.random() * 0.5 + 0.5
                        ]);
                    }, Math.random() * (100 + 33 * i));
                }
                physics.h = 0;
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

    updateWebPos();

    return {
        update,
        render,
        enable,
        disable,
        order: -9000,
        tags: ['physics'],
        physics,
    };
}

export default Web;