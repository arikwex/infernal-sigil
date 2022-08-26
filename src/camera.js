import * as bus from './bus';
import { canvas } from "./canvas";
import { getObjectsByTag } from "./engine"

function Camera(x, y) {
    let anim = 0;
    let shake = 0;
    let tx = x;
    let ty = y;
    let tz = canvas.width / 1400;
    let z = tz;

    function update(dT) {
        anim += dT;
        const player = getObjectsByTag('player')[0];
        if (player) {
            const px = player.playerHitbox.x;
            const py = player.playerHitbox.y;
            const { width, height } = canvas;
            const W = width / 8;
            const H = height / 6;
            if (px < x - W) { tx = px + W; }
            if (px > x + W) { tx = px - W; }
            if (py < y - H) { ty = py + H; }
            if (py > y + H*0.8) { ty = py - H*0.8; }
        }
        shake = Math.max(shake-dT,0);
        x += (tx - x) * 12 * dT;
        y += (ty - y) * 12 * dT;
        z += (tz - z) * 3 * dT;
    }

    function set(ctx) {
        const dx = Math.cos(anim)*3 + Math.cos(anim*40) * 15 * shake;
        const dy = Math.cos(anim*0.8)*3 + Math.cos(anim*23) * 8 * shake;
        const px = -x + canvas.width/2 + dx;
        const py = -y + canvas.height/2 + dy;
        
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.scale(z,z);
        ctx.translate(-x, -y);
    }

    bus.on('player:hit', () => shake=0.5);

    return {
        update,
        set,
        order: -10000,
        tags: ['camera']
    }
}

export default Camera;