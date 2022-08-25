import { renderMesh, scaleInPlace } from "./canvas";
import { getCurrentGameState } from "./gamestate";

function HUD() {
    let anim = 0;

    const headMesh = [
        ['#e22', 9, 0],
        [14, -40, 18, -26, 1, 0, -1, 0, -18, -26, -14, -40],
        [-7, -11, 7, -11],
        ['#fff', 4, 5],
        [-9, -11, -3, -9],
        [9, -11, 3, -9],
    ];

    function update(dT) {
        anim += dT;
    }

    function render(ctx) {
        const gamestate = getCurrentGameState();
        const xfm = ctx.getTransform();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.scale(0.8, 0.8);
        let maxHp = gamestate.getMaxHp();
        let hp = gamestate.getHp();
        for (let i = 0 ; i < gamestate.getMaxHp(); i++) {
            if (i >= hp) {
                headMesh[0][0] = '#555';
                headMesh[3][0] = '#555';
            } else {
                headMesh[0][0] = '#e22';
                headMesh[3][0] = '#fff';
            }
            renderMesh(headMesh, 50 + i * 50, 72, 0, 0, 0);
        }
        ctx.setTransform(xfm);
    }

    return {
        update,
        render,
        order: 10000
    }
}

export default HUD;