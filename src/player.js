import { color, renderMesh } from './canvas';

function Player(x, y) {
    const pos = { x, y };
    const thickness = 9;
    let anim = 0;

    const headMesh = [
        ['#e22', thickness, 0],
        [14, -40, 18, -26, 1, 0, -1, 0, -18, -26, -14, -40],
        [-7, -11, 7, -11],
        ['#fff', 4, 5],
        [-9, -11, -3, -9],
        [9, -11, 3, -9],
    ];
    const bodyMesh = [
        ['#e22', thickness, 0],
        [0, 0, 0, 20],
        [0, 20, 7, 37],
        [0, 20, -7, 37],
    ];
    const handMesh = [
        ['#e22', thickness, 0],
        [4, 0, 14, 6],
        ['#ee2', 3, 0],
        [18, 5, 22, 8],
        [15, 9, 19, 13],
    ];
    const tailMesh = [
        ['#e22', thickness, 0],
        [0, 20, -16, 31, -26, 31, -32, 22, -34, 15]
    ];

    function update(dT) {
        anim += dT;
    }

    function render(ctx) {
        const t = Math.cos(anim) * 0.7;
        const a = anim * 6;

        renderMesh(tailMesh, { x: pos.x, y: pos.y - 8, z: 0 }, { t: t + 1.57 + t * 0.3, p: 0 });
        renderMesh(handMesh, { x: pos.x, y: pos.y - Math.cos(a + 3) * 1.5 + 1, z: 0 }, { t: t, p: 0 });
        renderMesh(bodyMesh, { x: pos.x, y: pos.y - 8, z: 0 }, { t: t, p: 0 });
        renderMesh(handMesh, { x: pos.x, y: pos.y - Math.cos(a + 3) * 1.5 + 1, z: 0 }, { t: t+3.14, p: 0 });
        renderMesh(headMesh, { x: pos.x, y: pos.y + Math.cos(a + 1) * 1.5 + 1, z: 10 }, { t: t, p: t*0.3 });

        //[0, 20, -16, 31, -26, 31, -32, 22, -34, 15]
        tailMesh[1][3] = Math.cos(a) * 1 + 31;
        tailMesh[1][5] = Math.cos(a + 1) * 1 + 31;
        tailMesh[1][7] = Math.cos(a + 2) * 2 + 22;
        tailMesh[1][9] = Math.cos(a + 3) * 1 + 15;
    }

    return {
        update,
        render,
    };
}

export default Player;