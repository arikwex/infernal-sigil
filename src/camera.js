import * as bus from './bus';
import { canvas } from "./canvas";
import { vertical } from './controls';
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
    let startingUp = 0;

    let bgBot = [0, 0, 0];
    let bgTop = [0, 0, 0];

    function update(dT) {
        anim += dT;
        shake = Math.max(shake-dT,0);
        startingUp += dT;

        const ky = startingUp < 1.5 ? 24 : 12;
        x = self.x = x + (tx - x) * 4 * dT;
        y = self.y = y + (ty - y) * ky * dT;
        z += (tz - z) * 3 * dT;

        const kz = startingUp < 1.5 ? 1 : 4;
        tz += (canvas.width / 1700 - tz) * kz * dT;

        if (getHp() > 0) {
            const px = player.playerHitbox.x;
            const py = player.playerHitbox.y;
            const { height } = canvas;
            const H = height / 6 / z;
            tx = px + player.getVX() * 0.1;
            if (py < y - H/2) { ty = py + H/2; }
            if (py > y + H) { ty = py - H; }
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
        tz = tz_ * canvas.width / 1700;
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