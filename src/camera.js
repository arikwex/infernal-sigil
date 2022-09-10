import * as bus from './bus';
import { canvas } from "./canvas";
import { getObjectsByTag } from "./engine"
import { EVENT_PLAYER_ABILITY_GRANT, EVENT_PLAYER_CHECKPOINT, EVENT_PLAYER_HIT } from './events';
import { getHp } from './gamestate';
import { TAG_CAMERA, TAG_MAP, TAG_PLAYER } from './tags';

function Camera(x, y) {
    const player = getObjectsByTag(TAG_PLAYER)[0];
    x = player.playerHitbox.x;
    y = player.playerHitbox.y+200;
    let self = {};
    let anim = 0;
    let shake = 0;
    let tx = x;
    let ty = y;
    let tz = 4;
    let z = tz;

    let bgBot = [0, 0, 0];
    let bgTop = [0, 0, 0];

    function update(dT) {
        anim += dT;
        shake = Math.max(shake-dT,0);
        x = self.x = x + (tx - x) * 12 * dT;
        y = self.y = y + (ty - y) * 12 * dT;
        z += (tz - z) * 3 * dT;
        tz += (canvas.width / 1500 - tz) * 4 * dT;

        if (getHp() > 0) {
            const px = player.playerHitbox.x;
            const py = player.playerHitbox.y;
            const { width, height } = canvas;
            const W = width / 10;
            const H = height / 8;
            if (px < x - W) { tx = px + W; }
            if (px > x + W) { tx = px - W; }
            if (py < y - H) { ty = py + H; }
            if (py > y + H*0.8) { ty = py - H*0.8; }
        }

        // Should technically be in the render loop
        const m = getObjectsByTag(TAG_MAP)[0];
        const themeData = m.getTheme(x/100, y/100);
        for (let i = 0; i < 3; i++) {
            bgTop[i] += (themeData[i] - bgTop[i]) * 3 * dT;
            bgBot[i] += (themeData[i + 3] - bgBot[i]) * 3 * dT;
        }
        document.body.style = `background:linear-gradient(0deg,rgb(${bgBot}) 0%,rgb(${bgTop}) 100%)`;
    }

    function set(ctx) {
        const dx = Math.cos(anim)*3 + Math.cos(anim*40) * 15 * shake;
        const dy = Math.cos(anim*0.8)*3 + Math.cos(anim*23) * 8 * shake;

        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.scale(z,z);
        ctx.translate(-x+dx, -y+dy);
    }

    function aim(tx_, ty_, tz_, jump_) {
        tx = tx_;
        ty = ty_;
        tz = tz_ * canvas.width / 1500;
        if (jump_) {
            x = tx;
            y = ty;
            z = tz;
        }
    }
    
    function shakeIt() { shake=0.5; }

    bus.on(EVENT_PLAYER_HIT, shakeIt);
    bus.on(EVENT_PLAYER_ABILITY_GRANT, shakeIt);
    bus.on(EVENT_PLAYER_CHECKPOINT, shakeIt);

    self = {
        update,
        set,
        aim,
        x, y,
        order: -10000,
        tags: [TAG_CAMERA]
    };

    return self;
}

export default Camera;