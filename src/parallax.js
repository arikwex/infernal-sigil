import { renderMesh, scaleInPlace } from "./canvas";
import { getObjectsByTag } from "./engine";

function Parallax(x, y) {
    const z = 1 + Math.random() * 3;
    const angle = (Math.random() - 0.5) * 0.3;
    const terrain = [-100, 0];
    const islandMesh = [
        ['', 1, 0],
        terrain
    ];
    const color = 'rgba(0,0,0,0.13)';

    for (let i = -100; i < 100;) {
        i += Math.random() * 10 + 10;
        const p = i / 100;
        if (p > 0.95) {
            continue;
        }
        terrain.push(i, (1 - p * p) * (50 + 20 * Math.random()));
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
        const k2 = (1 + z * 0.6);

        const px = x + camera.getX() / k2;
        const py = y + camera.getY() / k2 / 1.5;
        if (Math.abs(px - cx) > 2000 || Math.abs(py - cy) > 2000) {
            return;
        }

        islandMesh[0][0] = color;
        renderMesh(islandMesh, px, py, 0, 0, angle, color);
    }

    return {
        render,
        order: -20000 - z
    };
}

export default Parallax;