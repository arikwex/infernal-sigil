import * as bus from './bus';
import { scaleInPlace } from './canvas';
import { renderMesh } from './canvas';
import { BoundingBox } from './bbox';

// Values -> 20, 50, 100
// Hp -> 3, 6, 9 (1 bone each)
const boneMap = {1: 7, 2: 14, 3: 11};
const skullMap = {1: 1, 2: 3, 3: 7 };
const colorMap = {1: '#a63', 2: '#889', 3: '#db1'};
const bgColorMap = {1: '#742', 2: '#667', 3: '#b90'};

function Treasure(x, y, t) {
    y += 50;
    let hitTimer = 0;
    let phase = 0;
    let hp = 3 * t;
    const myHitbox = new BoundingBox(x-25,y-55,0,0,50,55);

    const baseColor = colorMap[t];
    const bgColor = bgColorMap[t];
    const treasureMesh = [
        [baseColor, 8, 0],
        [20, 0, -20, 0, -28, -23, 28, -23, 20, 0],
        [baseColor, 8, 0],
        [-28, -23, -24, -40, 24, -40, 28, -23],
        ['#ffa', 8, 0],
        [0, -27, 0, -19],
    ];

    function update(dT) {
        if (hp <= 0) {
            bus.emit('bone:spawn', [x,y-20, boneMap[t], 1]);
            bus.emit('bone:spawn', [x,y-20, skullMap[t], 2]);
            return true;
        }
        hitTimer = Math.max(hitTimer - dT, 0);
    }

    function render(ctx) {
        const decay = Math.exp(hitTimer * 6 - 3);
        const dy = 2 + Math.abs(Math.cos(hitTimer * 20) * 12) * decay / 10;
        const da = Math.cos(hitTimer * 30 + phase) * hitTimer * decay / 60;
        const xfm = ctx.getTransform();
        scaleInPlace(0.75 + t * 0.15, x, y);
        renderMesh(treasureMesh, x, y - dy, 0, 0, da, bgColor);
        ctx.setTransform(xfm);
    }

    function hitCheck([attackHitbox, dir, owner]) {
        if (myHitbox.isTouching(attackHitbox)) {
            hitTimer = 1;
            phase = Math.random() * 7;
            hp -= 1;
            bus.emit('bone:spawn', [x,y-20,1,1]);
            bus.emit('attack:hit', [owner]);
        }
    }

    function enable() {
        bus.on('attack', hitCheck);
    }

    function disable() {
        bus.off('attack', hitCheck);
    }

    return {
        update,
        render,
        enable,
        disable,
        order: -6000,
    }
}

export default Treasure;