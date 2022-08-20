import { color, thickLine, thinLine } from './canvas';

function Player(x, y) {
    function update(dT) {
    }

    function render(ctx) {
        const xfm = ctx.getTransform();
        ctx.translate(x, y);
        // Head
        thickLine();
        color('#e22');
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(-19,-29);
        ctx.lineTo(-19+4,-29-15);
        ctx.moveTo(0,0);
        ctx.lineTo(11,-31);
        ctx.lineTo(11-5,-31-13);
        ctx.moveTo(-7,-12);
        ctx.lineTo(4,-14);
        ctx.stroke();
        // Eyes
        thinLine();
        color('#fff');
        ctx.beginPath();
        ctx.moveTo(-7,-12);
        ctx.lineTo(-1,-8);
        ctx.moveTo(6,-8);
        ctx.lineTo(10,-12);
        ctx.stroke();
        ctx.setTransform(xfm);
    }

    return {
        update,
        render,
    };
}

export default Player;