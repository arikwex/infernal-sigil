import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";
import * as bus from './bus';
import { inView } from "./utils";

function Gate(x, y, switchNum) {
    let open = false;
    let pos = 50;
    const gateMesh = [
        ['#fff', 8, 0],
        [-40, 0, -43, -200-30, -40, -230-30, -30, -230-30, -25, -220-30, -33, -215-30],
        [-20, 0, -25, -200],
        [0, 0, 0, -200],
        [20, 0, 25, -200],
        [40, 0, 43, -200-30, 40, -230-30, 30, -230-30, 25, -220-30, 33, -215-30],
        [-50, -190, 50, -190],
        [-50, -20, 50, -20],
    ];
    const physics = new BoundingBox(x-50,y-220,0,0,100,220);

    function update(dT) {
        pos += ((open ? -150 : 50) - pos) * dT;
        physics.y = y+pos-220;
    }

    function render(ctx) {
        renderMesh(gateMesh, x, y+pos, 0, 0, 0);
    }

    function onSwitch([num, state]) {
        if (num == switchNum) {
            open = state;
        }
    }

    function enable() {
        bus.on('switch', onSwitch);
    }

    function disable() {
        bus.off('switch', onSwitch);
    }

    return {
        update,
        render,
        enable,
        disable,
        inView: (cx, cy) => inView(x, y, cx, cy),
        tags: ['physics'],
        physics,
        order: -7000
    };
}

export default Gate;