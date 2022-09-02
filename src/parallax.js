import { renderMesh, scaleInPlace } from "./canvas";
import { getObjectsByTag } from "./engine";

function Parallax(x, y) {
    const z = 1 + Math.random() * 3;
    const terrain = [-100, 0];
    const islandMesh = [
        ['', 1, 0],
        terrain
    ];
    for (let i = -100; i < 100;) {
        i += Math.random() * 10 + 10;
        const p = i / 100;
        if (p > 0.95) {
            continue;
        }
        terrain.push(i, (1 - p * p) * (30 + 50 * Math.random()));
    }
    terrain.push(100, 0);
    for (let i = 100; i > -100;) {
        i -= Math.random() * 30 + 30;
        const p = i / 100;
        if (p < -0.95) {
            continue;
        }
        terrain.push(i, -5-5 * Math.random());
    }
    terrain.push(-100, 0);
    

    function render(ctx) {
        const camera = getObjectsByTag('camera')[0];
        const cx = camera.getX();
        const cy = camera.getY();
        const theme = camera.getBgBot();
        const k = 2;
        const k2 = (1 + z * 0.6);

        const px = x + camera.getX() / k2;
        const py = y + camera.getY() / k2 / 1.5;
        if (Math.abs(px - cx) > 2000 || Math.abs(py - cy) > 2000) {
            return;
        }

        const color = 'rgba(0,0,0,0.13)';//`rgba(${theme[0]/k},${theme[1]/k},${theme[2]/k}, 0.2)`;
        islandMesh[0][0] = color;

        const xfm = ctx.getTransform();
        scaleInPlace(3.5/(1 + z * 0.6), px, py);
        renderMesh(islandMesh, px, py, 0, 0, 0, color);
        ctx.setTransform(xfm);
    }

    return {
        render,
        order: -20000 - z
    };
}

export default Parallax;