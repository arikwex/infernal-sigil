import * as bus from './bus';
import { canvas } from "./canvas";
import { getObjectsByTag } from "./engine"

function Camera(x, y) {
    let anim = 0;
    let shake = 0;

    function update(dT) {
        anim += dT;
        const player = getObjectsByTag('player')[0];
        if (player) {
            const px = player.playerHitbox.x;
            const py = player.playerHitbox.y;
            const { width, height } = canvas;
            const W = width / 4;
            const H = height / 4;
            if (px < x - W) { x = px + W; }
            if (px > x + W) { x = px - W; }
            if (py < y - H) { y = py + H; }
            if (py > y + H*0.8) { y = py - H*0.8; }
        }
        shake = Math.max(shake-dT,0);
    }

    function set(ctx) {
        const dx = Math.cos(anim)*3 + Math.cos(anim*40) * 15 * shake;
        const dy = Math.cos(anim*0.8)*3 + Math.cos(anim*23) * 8 * shake;
        ctx.translate(-x+canvas.width/2+dx, -y+canvas.height/2+dy);
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