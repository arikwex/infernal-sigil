import { renderMesh } from "./canvas";

function Switch(x, y, t) {
    const switchBaseMesh = [
        ['#eef', 6, 0],
        [-40, 50, -20, 25, 20, 25, 40, 50],
        [-40, 50, -20, 25, 20, 25, 40, 50]
    ];

    function update(dT) {

    }

    function render(ctx) {
        renderMesh(switchBaseMesh, x, y, 0, 0, 0);
    }

    return {
        update,
        render,
        order: -6000
    }
}

export default Switch;