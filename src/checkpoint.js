import { BoundingBox, isTouching } from "./bbox";
import { ctx, renderMesh } from "./canvas";
import { getObjectsByTag } from "./engine";
import * as bus from './bus';
import { headMeshAsset, makeGradient, symbolMeshAssets } from "./assets";
import { copy, inView } from "./utils";
import { getCheckpointId } from "./gamestate";
import { EVENT_FOCUS, EVENT_FOCUS_STOP, EVENT_PLAYER_CHECKPOINT, EVENT_PLAYER_RESET } from "./events";
import { TAG_CAMERA, TAG_PHYSICS, TAG_PLAYER } from "./tags";

function Checkpoint(x, y, checkpointId) {
    let anim = 0;
    let engaging = 0;
    let used = false;
    let engagedLastFrame = false;

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

    const gradient = makeGradient(x, y);
    const physics = BoundingBox(x-100,y,0,0,200,50);
    const touchbox = BoundingBox(x-75,y-10,0,0,150,10);

    function update(dT) {
        used = getCheckpointId() == checkpointId;
        anim += dT;

        if (!used) {
            if (isTouching(touchbox, getObjectsByTag(TAG_PLAYER)[0].playerHitbox)) {
                if (!engagedLastFrame) {
                    bus.emit(EVENT_FOCUS);
                    engagedLastFrame = true;
                }
                engaging += dT;
                const cam = getObjectsByTag(TAG_CAMERA)[0];
                const alpha = engaging / 3;
                const beta = 1 - alpha;
                cam.aim(cam.x * beta + x * alpha, cam.y * beta + (y-100) * alpha, 1 + Math.sqrt(engaging) * 0.4 * alpha, alpha);
                if (engaging > 3) {
                    bus.emit(EVENT_PLAYER_CHECKPOINT, [checkpointId]);
                }
            } else {
                if (engagedLastFrame) {
                    bus.emit(EVENT_FOCUS_STOP);
                    engagedLastFrame = false;
                }
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
            ctx.globalAlpha = Math.cos(engaging * engaging * 15) * 0.5 + 0.5;
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
        if (checkpointId == getCheckpointId()) {
            getObjectsByTag(TAG_PLAYER)[0].reset(x, y - 150);
        }
    }

    bus.on(EVENT_PLAYER_RESET, onReset);

    return {
        update,
        render,
        inView: (cx, cy) => inView(x, y, cx, cy),
        tags: [TAG_PHYSICS],
        physics,
        order: -8000
    };
}

export default Checkpoint;