import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";

function Wall(x, y, w, h) {
    const physics = new BoundingBox(x, y, 0, 0, w, h);
    const wallMesh = [
        ['#a99', 5, 0]
    ];
    //wallMesh.push([0, 0, w, 0, w, h, 0, h, 0, 0]);
    let outline = [];
    let dx = Math.random() * 6 + 6;
    for (let i = 0; i < w; i += dx) {
        outline.push(i, Math.random() * 6);
        outline.push(Math.min(w, i + dx), -Math.random() * 2);
        dx = Math.random() * 6 + 6;
    }
    outline.push(w, 0, w, h, 0, h, 0, 0);
    wallMesh.push(outline);

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