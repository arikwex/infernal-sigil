import { boneMeshAsset, headMeshAsset } from "./assets";
import { renderMesh, renderText } from "./canvas";
import { getCurrentGameState } from "./gamestate";
import { copy } from "./utils";

function HUD() {
    let anim = 0;

    const headMesh = copy(headMeshAsset);
    const boneMesh = copy(boneMeshAsset);

    function update(dT) {
        anim += dT;
    }

    function render(ctx) {
        const gamestate = getCurrentGameState();
        const xfm = ctx.getTransform();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.scale(0.8, 0.8);

        // Render HP
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
            renderMesh(headMesh, 50 + i * 55, 72, 0, 0, 0);
        }

        // Render Bone count
        renderMesh(boneMesh, 50, 103, 0, anim, 0);
        renderText(gamestate.getBones(), 70, 105, '#fff', 30);

        ctx.setTransform(xfm);
    }

    return {
        update,
        render,
        order: 10000
    }
}

export default HUD;