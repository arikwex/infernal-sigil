import { BoundingBox } from "./bbox"
import { getObjectsByTag } from "./engine";

function Bone(x, y, vx, vy) {
    const collectHitbox = new BoundingBox(x,y,1,1);

    function update(dT) {
        let collected = false;
        getObjectsByTag('player').map(({ playerHitbox }) => {
            if (collectHitbox.isTouching(playerHitbox)) {
                collected = true;
            }
        });
        if (collected) {
            return true;
        }
        collectHitbox.set(x-10,y-10,20,20);
    }

    function render(ctx) {
        ctx.beginPath();
        ctx.rect(x-10,y-10,20,20);
        ctx.fill();
    }

    return {
        update,
        render,
        collectHitbox
    }
}

export default Bone;