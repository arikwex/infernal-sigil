import * as bus from './bus';
import { boneMeshAsset, headMeshAsset, regionTitles } from "./assets";
import { canvas, color, renderMesh, renderText } from "./canvas";
import { getBones, getDeathCount, getHp } from "./gamestate";
import { clamp, copy } from "./utils";
import { EVENT_PLAYER_ABILITY_GRANT, EVENT_PLAYER_CHECKPOINT, EVENT_REGION } from './events';
import { getStartTime } from './engine';

function HUD() {
    let regionTitle = 'The Styx';
    let regionTitleTimer = 4;
    let totalTime = 4;

    const headMesh = copy(headMeshAsset);
    const boneMesh = copy(boneMeshAsset);

    function update(dT) {
        regionTitleTimer -= dT;
    }

    function render(ctx) {
        const xfm = ctx.getTransform();
        ctx.setTransform(0.8,0,0,0.8,0,0);

        // Render HP
        for (let i = 0 ; i < 3; i++) {
            if (i >= getHp()) {
                headMesh[0][0] = '#555';
                headMesh[3][0] = '#555';
            } else {
                headMesh[0][0] = '#e22';
                headMesh[3][0] = '#fff';
            }
            renderMesh(headMesh, 50 + i * 55, 72, 0, 0, 0);
        }

        // Render Bone count
        renderMesh(boneMesh, 50, 103, 0, -regionTitleTimer, 0);
        renderText(getBones(), 70, 105, 30);

        // Region Title
        if (regionTitleTimer > 0) {
            ctx.globalAlpha = clamp(regionTitleTimer, 0, 1) * clamp(-regionTitleTimer + totalTime, 0, 1);
            ctx.lineWidth = 18;
            renderText(regionTitle, 36, canvas.height * 1.15, 100);
            ctx.strokeStyle = '#000';
            ctx.strokeText(regionTitle, 36, canvas.height * 1.15);
            renderText(regionTitle, 36, canvas.height * 1.15, 100);
            ctx.globalAlpha = 1; 
        }

        ctx.setTransform(xfm);
    }

    function onRegionChange(regionId) {
        regionTitle = regionTitles[regionId];
        totalTime = 4;
        regionTitleTimer = totalTime;
    }

    function onCheckpoint() {
        regionTitle = 'Checkpoint';
        totalTime = 4;
        regionTitleTimer = totalTime;
    }

    function onGrant(a) {
        let playTimeSeconds = (Date.now() - getStartTime())/1000;
        let playTimeMinutes = parseInt(playTimeSeconds / 60);
        playTimeSeconds -= playTimeMinutes * 60;

        regionTitle = [
            'Twisted Horns - [C] to dash',
            'Iron Claws - Climb walls',
            'Fireball - [V] to cast',
            'Wingspan - [Z] to use',
            `VICTORY! 🦴${getBones()}  ⌛${playTimeMinutes}:${playTimeSeconds.toFixed(1)}  💀${getDeathCount()}`
        ][a];
        totalTime = a==4 ? 30 : 5;
        regionTitleTimer = totalTime;
    }

    bus.on(EVENT_REGION, onRegionChange);
    bus.on(EVENT_PLAYER_CHECKPOINT, onCheckpoint);
    bus.on(EVENT_PLAYER_ABILITY_GRANT, onGrant);

    return {
        update,
        render,
        order: 10000
    }
}

export default HUD;