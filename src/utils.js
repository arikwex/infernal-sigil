import { getObjectsByTag } from "./engine";
import { TAG_PHYSICS } from "./tags";

function clamp(v, min, max) {
    return Math.max(Math.min(v, max), min);
}

function copy(arr) {
    return JSON.parse(JSON.stringify(arr));
}

function inView(x, y, cx, cy) {
    return !(x > cx + 1000 || y > cy + 700 || x < cx - 1000 || y < cy - 700);
}

const physicsResult = [0, 0, false, false, false, false];
function physicsCheck(myHitbox) {
    let x = myHitbox.x;
    let y = myHitbox.y;
    let onGround = false;
    let onRightWall = false;
    let onLeftWall = false;
    let onRoof = false;
    getObjectsByTag(TAG_PHYSICS).map(({ physics }) => {
        if (myHitbox.isTouching(physics)) {
            // Sides
            let onThisWall = false;
            if (y + myHitbox.oy + 10 < physics.y + physics.h && y + myHitbox.oy + myHitbox.h - 10 > physics.y) {
                if (x-10 < physics.x) {
                    x = physics.x + physics.ox - myHitbox.ox - myHitbox.w + 0.1;
                    onRightWall = true;
                    onThisWall = true;
                }
                if (x+10 > physics.x + physics.w) {
                    x = physics.x + physics.ox + physics.w - myHitbox.ox - 0.1;
                    onLeftWall = true;
                    onThisWall = true;
                }
            }
            if (!onThisWall) {
                // Falling to hit top of surface
                if (y - 45 < physics.y) {
                    y = physics.y + physics.oy - myHitbox.oy - myHitbox.h + 0.1;
                    onGround = true;
                }
                // Hit head on bottom of surface
                if (y + myHitbox.oy + myHitbox.h/2 > physics.y + physics.h) {
                    y = physics.y + physics.oy + physics.h - myHitbox.oy + 0.1;
                    onRoof = true;
                }
            }
            myHitbox.x = x;
            myHitbox.y = y;
        }
    });
    physicsResult[0] = x;
    physicsResult[1] = y;
    physicsResult[2] = onGround;
    physicsResult[3] = onRightWall;
    physicsResult[4] = onLeftWall;
    physicsResult[5] = onRoof;
    return physicsResult;
}

const groundResult = [false, false];
function groundCheck(myHitbox, wx = 1, wy = 0) {
    let hasRight = false;
    let hasLeft = false;
    let ox = myHitbox.x;
    let oy = myHitbox.y;
    getObjectsByTag(TAG_PHYSICS).map(({ physics }) => {
        let sx = ox + 40 * wx - 4 * wy;
        let sy = oy + 4 * wx + 40 * wy;
        if (physics.containPt(sx, sy)) {
            hasRight = true;
        }
        sx = ox - 40 * wx - 4 * wy;
        sy = oy + 4 * wx - 40 * wy;
        if (physics.containPt(sx, sy)) {
            hasLeft = true;
        }
    });
    myHitbox.x = ox;
    myHitbox.y = oy;
    groundResult[0] = hasRight;
    groundResult[1] = hasLeft;
    return groundResult;
}

export {
    clamp,
    copy,
    inView,
    physicsCheck,
    groundCheck,
}