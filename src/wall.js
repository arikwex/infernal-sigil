import { ctx } from './canvas';

function WallPhysics(x, y, w, h) {
    function isHorizontal(x2, w2) {
        return (x2 + w2 > x) && (x2 < x + w);
    }

    function isVertical(y2, h2) {
        return (y2 + h2 > y) && (y2 < y + h);
    }

    function isAABB(x2, y2, w2, h2) {
        const isTouching = isHorizontal(x2, w2) && isVertical(y2, h2);
        // DEBUG
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isTouching ? '#f0f' : '#0f0';
        ctx.rect(x2, y2, w2, h2);
        ctx.rect(x, y, w, h);
        ctx.stroke();
        //
        return isTouching;
    }

    return {
        isAABB
    }
}

export {
    WallPhysics
};