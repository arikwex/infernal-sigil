import { color, renderMesh } from './canvas';

function Skeleton(x, y, type) {
    const thickness = 5;
    const size = 1.3;
    const bodyMesh = [
        ['#fff', thickness, 0],
        [0, -13, 4, -29, 13, -40],
        [0, -16, -2, -17],
        [2, -22, -3, -24],
        [4, -28, 0, -30],
        [6, -33, 4, -35],
    ];
    const legMesh = [
        ['#fff', thickness, 0],
        [-8, 0, 0, -13, 8, 0],
    ];
    const handMesh = [
        ['#fff', thickness, 0],
        [0, 0, 14, 15]
    ];
    const headMesh = [
        ['#fff', 9, 0],
        [3, 10, -3, 10, -3, 0, -6, -4, 0, -10, 6, -4, 3, 0, 3, 10],
        ['#000', 4, 5],
        [-5, -6, -3, -5],
        [5, -6, 3, -5],
    ];

    function update(dT) {

    }

    function render(ctx) {
        const t = Math.cos(Date.now()/1000) * 0.6;
        const xfm = ctx.getTransform();
        ctx.translate(x, y);
        ctx.scale(size, size);
        ctx.translate(-x, -y);
        renderMesh(legMesh, x, y, 0, t, 0);
        renderMesh(handMesh, x + 7 * t, y - 33 - 2 * t, -4, t * 2.1, -t/3);
        renderMesh(bodyMesh, x, y, 0, t * 2 - 1.57, 0);
        renderMesh(handMesh, x + 7 * t, y - 33 + 2 * t, 4, t * 2.1 + 3.14, -t/3);
        renderMesh(headMesh, x, y - 40, 23, -t, 0);
        ctx.setTransform(xfm);
    }

    return {
        update,
        render,
    };
}

export default Skeleton;