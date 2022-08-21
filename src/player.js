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
    const bodyMesh = [
        ['#e22', 10, 0],
        [0, 0, 0, 20],
        [0, 20, 7, 36],
        [0, 20, -7, 37],
    ];

    function update(dT) {
    }

    function render(ctx) {
        renderMesh(bodyMesh, { x: pos.x - 6, y: pos.y - 4 }, { t: -0.6, p: 0.1 });
        renderMesh(headMesh, pos, { t: -0.6, p: -0.1 });
    }

    return {
        update,
        render,
    };
}

export default Player;