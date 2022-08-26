import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";

function Wall(x, y, w, h) {
    const physics = new BoundingBox(x, y, 0, 0, w, h);
    const wallMesh = [
        ['#fff', 5, 0]
    ];
    wallMesh.push([0, 0, w, 0, w, h, 0, h, 0, 0]);

    function render(ctx) {
        renderMesh(wallMesh,x,y,0,0,0);
    }

    return {
        render,
        tags: ['physics'],
        physics,
        order: -5000
    }
}

export default Wall;