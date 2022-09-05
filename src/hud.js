import * as bus from './bus';
import { boneMeshAsset, headMeshAsset } from "./assets";
import { canvas, color, renderMesh, renderText } from "./canvas";
import { getCurrentGameState } from "./gamestate";
import { clamp, copy } from "./utils";

function HUD() {
    let anim = 0;
    
    let regionTitle = 'The Styx';
    let regionTitleTimer = 4;

    const headMesh = copy(headMeshAsset);
    const boneMesh = copy(boneMeshAsset);

    function update(dT) {
        anim += dT;
        regionTitleTimer -= dT;
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

        // Region Title
        if (regionTitleTimer > 0) {
            ctx.globalAlpha = clamp(regionTitleTimer, 0, 1) * clamp(-regionTitleTimer + 4, 0, 1);
            ctx.lineWidth = 6;
            color('#000', '#fff');
            renderText(regionTitle, 40, canvas.height * 1.15, '#fff', 100);
            ctx.strokeText(regionTitle, 40, canvas.height * 1.15);
            ctx.globalAlpha = 1; 
        }

        ctx.setTransform(xfm);
    }

    function onRegionChange(title) {
        regionTitle = title;
        regionTitleTimer = 4;
    }

    function enable() {
        bus.on('region', onRegionChange);
    }

    function disable() {
        bus.off('region', onRegionChange);
    }

    return {
        update,
        render,
        enable,
        disable,
        order: 10000
    }
}

export default HUD;