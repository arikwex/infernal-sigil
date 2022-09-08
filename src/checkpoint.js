import { BoundingBox, isTouching } from "./bbox";
import { ctx, renderMesh } from "./canvas";
import { add, getObjectsByTag } from "./engine";
import * as bus from './bus';
import Decoration from "./decoration";
import { headMeshAsset, symbolMeshAssets } from "./assets";
import { copy, inView } from "./utils";
import { getCurrentGameState } from "./gamestate";

function Checkpoint(x, y, checkpointId) {
    let anim = 0;
    let engaging = 0;
    let used = false;

    const platformMesh = [
        ['#777', 5, 0],
        [100, 60, -100, 60, -100, 0, 100, 0, 100, 60]
    ];
    const bloodMesh = [
        ['#911', 10, 0],
        [-100, 10, -100, 0, 100, 0, 100, 25],
        [30, 0, 30, 25],
        [-70, 0, -70, 35],
        [60, 0, 60, 15],
    ];
    const headMesh = copy(headMeshAsset);
    headMesh[0][0] = '#ee2';
    headMesh.splice(3, 3);

    const symbolMeshes = copy(symbolMeshAssets);

    const gradient = ctx.createLinearGradient(x, y, x, y-200);
    gradient.addColorStop(0, 'rgba(255,255,110,0.3)');
    gradient.addColorStop(0.3, 'rgba(255,255,110,0.1)');
    gradient.addColorStop(1, 'rgba(255,255,110,0.0)');

    const physics = new BoundingBox(x-100,y,0,0,200,50);
    const touchbox = new BoundingBox(x-75,y-10,0,0,150,10);

    function update(dT) {
        used = getCurrentGameState().getCheckpointId() == checkpointId;
        anim += dT;

        if (!used) {
            if (isTouching(touchbox, getObjectsByTag('player')[0].playerHitbox)) {
                engaging += dT;
                const cam = getObjectsByTag('camera')[0];
                const alpha = engaging / 3;
                const beta = 1 - alpha;
                cam.aim(cam.getX() * beta + x * alpha, cam.getY() * beta + (y-100) * alpha, 1 + Math.sqrt(engaging) * 0.4 * alpha, alpha);
                if (engaging > 3) {
                    bus.emit('player:cpt', [checkpointId]);
                }
            } else {
                engaging -= engaging * 3 * dT;
            }
        } else {
            engaging = 3;
        }
    }

    function render(ctx) {
        symbolMeshes.map((m) => { m[0][0] = used ? '#ee2' : '#4af'; });
        renderMesh(platformMesh, x, y, 0, 0, 0, '#777');
        if (!used) {
            ctx.globalAlpha = Math.cos(engaging * engaging * 10) * 0.5 + 0.5;
        } else {
            ctx.fillStyle = gradient;
            ctx.fillRect(x - 50, y-200, 100, 200);
            renderMesh(headMesh, x, y - 50 + Math.cos(anim * 5) * 4, 0, anim, 0);
        }
        for (let i = 0; i < 5; i++) {
            renderMesh(symbolMeshes[i], x - (i-1.9) * 40, y + 25, 0, 0, 0);
        }
        ctx.globalAlpha = 1;
        renderMesh(bloodMesh, x, y, 0, 0, 0);
    }

    function onReset() {
        if (checkpointId == getCurrentGameState().getCheckpointId()) {
            getObjectsByTag('player')[0].reset(x, y - 150);
        }
    }

    function enable() {
        bus.on('player:rst', onReset);
    }

    function disable() {
        bus.off('player:rst', onReset);
    }

    return {
        update,
        render,
        enable,
        disable,
        inView: (cx, cy) => inView(x, y, cx, cy),
        tags: ['physics'],
        physics,
        order: -8000
    };
}

export default Checkpoint;