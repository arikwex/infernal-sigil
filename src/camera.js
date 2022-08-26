import { canvas } from "./canvas";
import { getObjectsByTag } from "./engine"

function Camera(x, y) {
    let anim = 0;

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
    }

    function set(ctx) {
        const dx = Math.cos(anim)*3;
        const dy = Math.cos(anim*0.8)*3;
        ctx.translate(-x+canvas.width/2+dx, -y+canvas.height/2+dy);
    }

    return {
        update,
        set,
        order: -10000,
        tags: ['camera']
    }
}

export default Camera;