import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";
import * as bus from './bus';
import { inView } from "./utils";
import { EVENT_SWITCH } from "./events";
import { TAG_PHYSICS } from "./tags";

function Gate(x, y, switchNum) {
    let open = false;
    let pos = 50;
    const gateMesh = [
        ['#fff', 8, 0],
        [0, 0, 0, -200],
        [-50, -190, 50, -190],
        [-50, -20, 50, -20],
    ];

    [-1,1].map((i)=>{
        gateMesh.push(
            [20*i, 0, 25*i, -200],
            [40*i, 0, 43*i, -200-30, 40*i, -230-30, 30*i, -230-30, 25*i, -220-30, 33*i, -215-30]
        );
    });

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
        bus.on(EVENT_SWITCH, onSwitch);
    }

    function disable() {
        bus.off(EVENT_SWITCH, onSwitch);
    }

    return {
        update,
        render,
        enable,
        disable,
        inView: (cx, cy) => inView(x, y, cx, cy),
        tags: [TAG_PHYSICS],
        physics,
        order: -7000
    };
}

export default Gate;