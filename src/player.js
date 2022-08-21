import { color, renderMesh } from './canvas';

function Player(x, y) {
    const pos = { x, y };
    const headMesh = [
        ['#e22', 10, 0],
        [14, -40, 18, -26, 1, 0, -1, 0, -18, -26, -14, -40],
        [-7, -11, 7, -11],
        ['#fff', 4, 5],
        [-9, -11, -3, -9],
        [9, -11, 3, -9],
    ];

    function update(dT) {
    }

    function render(ctx) {
        const rot = { t: -0.6, p: -0.1 };
        renderMesh(headMesh, pos, rot);
    }

    return {
        update,
        render,
    };
}

export default Player;