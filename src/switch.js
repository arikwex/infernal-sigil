import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";
import * as bus from './bus';
import { inView } from "./utils";

function Switch(x, y, switchNum, t = 0) {
    let active = false;
    const phase = t == 1;
    let angle = 0;
    const myHitbox = new BoundingBox(x-40,y-15,0,0,80,65);

    const switchRodMesh = [
        ['#a53', 8, 0],
        [0, 0, 0, -60, -5, -68, 0, -76, 5, -68, 0, -60],
    ];
    const switchBaseMesh = [
        ['#a53', 8, 0],
        [-30, 50, -16, 28, 16, 28, 30, 50],
        [-18, 50, -10, 38, 10, 38, 18, 50]
    ];

    function update(dT) {
        const targetAngle = (active ^ phase) ? 1 : -1;
        angle += (targetAngle * 0.7 - angle) * 10 * dT;
        switchRodMesh[0][0] = active ? '#5af' : '#a53';
    }

    function render(ctx) {
        renderMesh(switchRodMesh, x, y+50, 0, 0, angle);
        renderMesh(switchBaseMesh, x, y, 0, 0, 0);
    }

    function hitCheck([attackHitbox, dir, owner]) {
        if (myHitbox.isTouching(attackHitbox) && !active) {
            active = true;
            bus.emit('switch', [switchNum, active]);
            bus.emit('attack:hit', [owner]);
            myHitbox.x = -1000;
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
        inView: (cx, cy) => inView(x, y, cx, cy),
        order: -6000
    }
}

function Switch2(x,y,n) { return Switch(x,y,n,1); }

export {
    Switch,
    Switch2
};