import * as bus from './bus';
import { boneMeshAsset, headMeshAsset, regionTitles, treasureMeshAsset } from "./assets";
import { canvas, color, renderMesh, renderText, retainTransform, scaleInPlace } from "./canvas";
import { getBones, getDeathCount, getHp, getTotalNumTreasure, getTreasures } from "./gamestate";
import { clamp, copy } from "./utils";
import { EVENT_PLAYER_ABILITY_GRANT, EVENT_PLAYER_CHECKPOINT, EVENT_REGION } from './events';
import { getObjectsByTag, getStartTime } from './engine';
import { TAG_MAP, TAG_PLAYER } from './tags';
import { holdingMap } from './controls';

function HUD() {
    let regionTitle;
    let regionTitleTimer;
    let totalTime;
    let fadeIn = 0;

    const headMesh = copy(headMeshAsset);
    const boneMesh = copy(boneMeshAsset);
    const treasureMesh = copy(treasureMeshAsset);

    function update(dT) {
        regionTitleTimer -= dT;
        fadeIn += dT;
    }

    function render(ctx) {
        retainTransform(() => {
            // Render minimap
            if (holdingMap()) {
                ctx.setTransform(1,0,0,1,0,0);
                ctx.fillStyle='rgba(0,0,0,0.7)';
                ctx.fillRect(0,0,canvas.width, canvas.height);
                ctx.setTransform(4,0,0,4,canvas.width/2-252, canvas.height/2-252);
                ctx.drawImage(getObjectsByTag(TAG_MAP)[0].m, 0, 0);
                if (Math.cos(Date.now()/50)<0.5) {
                    const player = getObjectsByTag(TAG_PLAYER)[0].playerHitbox;
                    ctx.fillStyle = '#e22';
                    ctx.fillRect(player.x/100-0.5, player.y/100-1.5, 2, 2);
                }
            }

            ctx.setTransform(0.8,0,0,0.8,0,0);
            // Render HP
            for (let i = 0 ; i < 3; i++) {
                if (i >= getHp()) {
                    headMesh[0][0] = headMesh[3][0] = '#555';
                } else {
                    headMesh[0][0] = '#e22';
                    headMesh[3][0] = '#fff';
                }
                renderMesh(headMesh, 50 + i * 55, 72, 0, 0, 0);
            }

            // Render Bone count
            renderMesh(boneMesh, 50, 144, 0, -regionTitleTimer, 0);
            renderText(getBones(), 80, 146, 30);

            // Region Title
            if (regionTitleTimer > 0) {
                ctx.globalAlpha = clamp(regionTitleTimer, 0, 1) * clamp(-regionTitleTimer + totalTime, 0, 1);
                ctx.lineWidth = 18;
                renderText(regionTitle, 36, canvas.height * 1.15, 80);
                ctx.strokeStyle = '#000';
                ctx.strokeText(regionTitle, 36, canvas.height * 1.15);
                renderText(regionTitle, 36, canvas.height * 1.15, 80);
                ctx.globalAlpha = 1; 
            }

            // Render Treasure count
            renderText(`${getTreasures()} / ${getTotalNumTreasure()}`, 80, 103, 30);
            scaleInPlace(0.5, 50, 102);
            renderMesh(treasureMesh, 50, 120, 0, 0, 0, '#742');

            // Fade in initial
            if (fadeIn < 2) {
                ctx.setTransform(1,0,0,1,0,0);
                ctx.fillStyle=`rgba(0,0,0,${1-fadeIn*fadeIn/4})`;
                ctx.fillRect(0,0,canvas.width,canvas.height);
            }
        });
    }

    function onRegionChange(regionId) {
        regionTitle = regionTitles[regionId];
        totalTime = 6;
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
            'Twisted Horns - [C] or [K] to dash',
            'Iron Claws - Climb walls',
            'Fireball - [V] or [L] to cast',
            'Wingspan - Double jump to use',
            `VICTORY! 🦴${getBones()}  ⌛${playTimeMinutes}:${(playTimeSeconds < 10 ? '0' : '')}${playTimeSeconds.toFixed(1)}  💀${getDeathCount()}`
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