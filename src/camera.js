import * as bus from './bus';
import { canvas } from "./canvas";
import { getObjectsByTag } from "./engine"

function Camera(x, y) {
    const player = getObjectsByTag('player')[0];
    x = player.playerHitbox.x;
    y = player.playerHitbox.y;
    let anim = 0;
    let shake = 0;
    let tx = x;
    let ty = y;
    let tz = canvas.width / 1400;
    let z = tz;

    let bgBot = [0, 0, 0];
    let bgTop = [0, 0, 0];

    function update(dT) {
        anim += dT;
        shake = Math.max(shake-dT,0);
        x += (tx - x) * 12 * dT;
        y += (ty - y) * 12 * dT;
        z += (tz - z) * 3 * dT;
        tz += (canvas.width / 1400 / 3 - tz) * 4 * dT;

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

        // Chould technically be in the render loop
        const m = getObjectsByTag('map')[0];
        const themeData = m.getTheme(x/100, y/100);
        for (let i = 0; i < 3; i++) {
            bgTop[i] += (themeData[i] - bgTop[i]) * 3 * dT;
            bgBot[i] += (themeData[i + 3] - bgBot[i]) * 3 * dT;
        }
        document.body.style = `background: linear-gradient(0deg, rgb(${bgBot.join(',')}) 0%, rgb(${bgTop.join(',')}) 100%)`;
    }

    function set(ctx) {
        const dx = Math.cos(anim)*3 + Math.cos(anim*40) * 15 * shake;
        const dy = Math.cos(anim*0.8)*3 + Math.cos(anim*23) * 8 * shake;

        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.scale(z,z);
        ctx.translate(-x+dx, -y+dy);
    }

    function getX() {
        return x;
    }

    function getY() {
        return y;
    }

    function getBgBot() {
        return bgBot;
    }

    function aim(tx_, ty_, tz_, jump_) {
        tx = tx_;
        ty = ty_;
        tz = tz_ * canvas.width / 1400;
        if (jump_) {
            x = tx;
            y = ty;
            z = tz;
        }
    }

    bus.on('player:hit', () => shake=0.5);
    bus.on('player:grant', () => shake=0.5);
    bus.on('player:cpt', () => shake=0.5);

    return {
        update,
        set,
        aim,
        getX,
        getY,
        getBgBot,
        order: -10000,
        tags: ['camera']
    }
}

export default Camera;