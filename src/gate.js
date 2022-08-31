import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";

function Gate(x, y) {
    let open = false;
    let pos = 0;
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
    const physics = new BoundingBox(x-50,y-170,0,0,100,220);

    function update(dT) {
        if (open) {
            pos += (-200 + pos) * 2 * dT;
        }
    }

    function render(ctx) {
        renderMesh(gateMesh, x, y+50+pos, 0, 0, 0);
    }

    return {
        update,
        render,
        tags: ['physics'],
        physics,
        order: -7000
    };
}

export default Gate;