const canvas = document.getElementsByTagName('canvas')[0];
canvas.width = 800;
canvas.height = 600;
const ctx = canvas.getContext('2d');

function thinLine() { ctx.lineWidth = 3.5; }
function thickLine() { ctx.lineWidth = 8; }
function color(c) { ctx.strokeStyle = c; ctx.fillStyle = c; }

ctx.lineJoin = 'round';
ctx.lineCap = 'round';

export {
    canvas,
    ctx,
    color,
    thinLine,
    thickLine
};