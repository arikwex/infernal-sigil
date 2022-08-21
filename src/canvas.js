const canvas = document.getElementsByTagName('canvas')[0];
canvas.width = 800;
canvas.height = 600;
const ctx = canvas.getContext('2d');

function thickness(t) { ctx.lineWidth = t; }
function color(c) { ctx.strokeStyle = c; ctx.fillStyle = c; }

function renderMesh(mesh, pos, rot) {
    const xfm = ctx.getTransform();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rot.p);
    const d = Math.cos(rot.t);
    const d2 = Math.sin(rot.t);
    let z = 0;

    for (let r = 0; r < mesh.length; r++) {
        const data = mesh[r];
        if (data.length == 3) {
            color(data[0]);
            thickness(data[1]);
            z = data[2];
        } else {
            ctx.beginPath();
            ctx.moveTo(data[0] * d - z * d2, data[1]);
            for (let i = 2; i < data.length; i+=2) {
                ctx.lineTo(data[i] * d - z * d2, data[i+1]);
            }
            ctx.stroke();
        }
    }

    ctx.setTransform(xfm);
}

ctx.lineJoin = 'round';
ctx.lineCap = 'round';

export {
    canvas,
    ctx,
    color,
    renderMesh,
};