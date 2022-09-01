import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";
import { add } from "./engine";

function Shrine(x, y, t) {
    let anim = 0;

    const platformMesh = [
        ['#777', 5, 0],
        [200, 60, -200, 60, -200, 0, -100, 0, -100, -50, 100, -50, 100, 0, 200, 0, 200, 60]
    ];
    const bloodMesh = [
        ['#911', 10, 0],
        [-100, -40, -100, -50, 100, -50, 100, -25],
        [-70, -50, -70, -25],
        [40, -50, 40, -15],
        [60, -50, 60, -35],
    ];
    const pentagramMesh = [
        ['#fff', 6, 0],
    ];
    let a1 = [];
    let a2 = [];
    const step = 6.28/5;
    for (let i = 0; i < 6; i++) {
        a1.push(Math.sin(i * step) * 100, -Math.cos(i * step) * 100);
        a2.push(Math.sin(i * step * 2) * 100, -Math.cos(i * step * 2) * 100);
    }
    pentagramMesh.push(a1, a2);
    
    // Symbols
    const symbolMeshes = [
        [['#4af', 2, 0], [0, -15, 10, 0, 0, 15, -10, 0, 0, -15]],
        [['#4af', 2, 0], [10, -15, -10, -7, 10, 0, -10, 7, 10, 15]],
        [['#4af', 2, 0], [0, -18, 0, -5, 12, 0, 0, 12, -12, 0]],
        [['#4af', 2, 0], [10, -12, 15, 12, -15, 12, 0, 0, -10, 0]],
        [['#4af', 2, 0], [-15, -11, -15, 11, 0, 11, 0, -11, 15, -11, 15, 11]],
    ];

    const physics = new BoundingBox(x-200,y,0,0,400,50);
    const secondPhysics = { tags: ['physics'], physics: new BoundingBox(x-100,y-50,0,0,200,50) };

    function update(dT) {
        anim += dT;
    }

    function render(ctx) {
        const dy = -200 + Math.sin(anim*2) * 5;
        renderMesh(platformMesh, x, y, 0, 0, 0, '#777');
        renderMesh(bloodMesh, x, y, 0, 0, 0);
        renderMesh(pentagramMesh, x, y + dy, 0, 0, 0);
        for (let i = 0; i < 5; i++) {
            const dr = Math.cos(i*0.2 + anim * 3) * 3 + 130;
            renderMesh(symbolMeshes[i], x + Math.sin(i * step) * dr, y + dy - Math.cos(i * step) * dr, 0, 0, 0);
        }
    }

    function enable() {
        add(secondPhysics);
    }

    function disable() {
        remove(secondPhysics);
    }

    return {
        update,
        render,
        enable,
        disable,
        tags: ['physics'],
        physics,
        order: -8000
    };
}

export default Shrine;