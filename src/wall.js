import { BoundingBox } from "./bbox";
import { canvas, renderMesh } from "./canvas";
import { TAG_PHYSICS } from "./tags";

function Wall(x, y, ex, ey, outlineData, BLOCK_SIZE, palette) {
    const w = (ex - x) * BLOCK_SIZE;
    const h = (ey - y) * BLOCK_SIZE;
    x = (x - 0.5) * BLOCK_SIZE;
    y = (y - 0.5) * BLOCK_SIZE;

    const physics = BoundingBox(x, y, 0, 0, w, h);
    const wallMesh = [
        [palette[0], 5, 0]
    ];
    let outlineTop = [];
    let dx = Math.random() * 6 + 6;
    for (let i = 0; i < w; i += dx) {
        outlineTop.push(i, Math.random() * 6, Math.min(w, i + dx), -Math.random() * 2);
        dx = Math.random() * 6 + 6;
    }
    wallMesh.push(outlineTop, ...outlineData[0], [w, h, 0, h], ...outlineData[1]);

    function render(ctx) {
        ctx.fillStyle = palette[1];
        ctx.fillRect(x-1, y, w+2, h);
        renderMesh(wallMesh,x,y,0,0,0);
    }

    function inView(cx, cy) {
        const dw = 1100;
        const dh = canvas.height / canvas.width * 1000;
        return !(x > cx + dw || y > cy + dh || x + w < cx - dw || y + h < cy - dh);
    }

    return {
        render,
        inView,
        tags: [TAG_PHYSICS],
        physics,
        order: -5000
    }
}

export default Wall;