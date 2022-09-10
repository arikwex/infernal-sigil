import { retainTransform } from "./canvas";
import { clamp, inView } from "./utils";

function FlameSFX(x, y, scale, lifetime, rot = 0) {
    let anim = 0;
    let baseScale = scale;

    function update(dT) {
        anim += 5 * dT;
        lifetime -= dT;
        scale = Math.min(baseScale * anim * 2, baseScale);
        if (lifetime < 0.5) {
            scale = baseScale * lifetime * 2;
            anim += 3 * dT;
        }
        if (lifetime < 0) {
            return true;
        }
    }

    function render(ctx) {
        retainTransform(() => {
            ctx.translate(x, y);
            ctx.rotate(-rot);
            ctx.fillStyle = '#f93';
            for (let i = 0; i < 6; i++) {
                let p = ((i + anim) % 6) / 6;
                let s = scale * clamp(10 * p / (1 + p * p * 15) * (1 - p), 0, 1);
                ctx.beginPath();
                ctx.arc(Math.cos(i * 4) * scale, - p * 40 * scale, 10 * s, 0, 6.28);
                ctx.fill();
            }
            ctx.fillStyle = '#f53';
            ctx.beginPath();
            ctx.arc(Math.cos(anim * 13) * scale / 2, - scale * 4, 5 * scale * (1 + Math.cos(anim * 11) * 0.1), 0, 6.28);
            ctx.fill();
        });
    }

    return {
        update,
        render,
        set: (a) => {x=a},
        end: () => {lifetime=0.25},
        inView: (cx, cy) => inView(x, y, cx, cy),
        order: -4500
    }
};

export default FlameSFX;