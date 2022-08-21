const canvas = document.getElementsByTagName('canvas')[0];
canvas.width = 1200;
canvas.height = window.innerHeight * 800 / window.innerWidth;
const ctx = canvas.getContext('2d');

function thickness(t) { ctx.lineWidth = t; }
function color(c) { ctx.strokeStyle = c; ctx.fillStyle = c; }

function renderMesh(mesh, x, y, baseZ, theta, phi) {
    const xfm = ctx.getTransform();
    ctx.translate(x, y);
    ctx.rotate(phi);
    const d = Math.cos(theta);
    const d2 = Math.sin(theta);
    let z = baseZ;

    for (let r = 0; r < mesh.length; r++) {
        const data = mesh[r];
        if (data.length == 3) {
            color(data[0]);
            thickness(data[1]);
            z = baseZ + data[2];
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