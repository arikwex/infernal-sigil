import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";
import * as bus from './bus';

function Switch(x, y, t, switchNum) {
    let active = false;
    const phase = false;
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

    function hitCheck([attackHitbox, dir]) {
        if (myHitbox.isTouching(attackHitbox)) {
            active = (dir > 0) ^ phase;
            bus.emit('switch', [switchNum, active]);
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
        order: -6000
    }
}

export default Switch;