import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";

function Wall(x, y, ex, ey, outlineData, BLOCK_SIZE) {
    const w = (ex - x) * BLOCK_SIZE;
    const h = (ey - y) * BLOCK_SIZE;
    x = (x - 0.5) * BLOCK_SIZE;
    y = (y - 0.5) * BLOCK_SIZE;
    
    const physics = new BoundingBox(x, y, 0, 0, w, h);
    const wallMesh = [
        ['#a99', 5, 0]
    ];
    let outlineTop = [];
    let dx = Math.random() * 6 + 6;
    for (let i = 0; i < w; i += dx) {
        outlineTop.push(i, Math.random() * 6);
        outlineTop.push(Math.min(w, i + dx), -Math.random() * 2);
        dx = Math.random() * 6 + 6;
    }
    wallMesh.push(outlineTop);
    wallMesh.push(...outlineData[0]);
    wallMesh.push([w, h, 0, h]);
    wallMesh.push(...outlineData[1]);
    

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