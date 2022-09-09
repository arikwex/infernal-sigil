import { headMeshAsset } from "./assets";

const canvas = document.getElementsByTagName('canvas')[0];
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

function color(c, c2) { ctx.strokeStyle = c; ctx.fillStyle = c2 || c; }
function scaleInPlace(s, x, y, s2) { ctx.translate(x, y); ctx.scale(s, s2 || s); ctx.translate(-x, -y); }

function renderMesh(mesh, x, y, baseZ, theta, phi, fillColor = null) {
    const xfm = ctx.getTransform();
    ctx.translate(x, y);
    ctx.rotate(phi);
    const d = Math.cos(theta);
    const d2 = Math.sin(theta);
    let z = baseZ;

    for (let r = 0; r < mesh.length; r++) {
        const data = mesh[r];
        if (data.length == 3) {
            color(data[0], fillColor || data[0]);
            ctx.lineWidth = data[1];
            z = baseZ + data[2];
        } else {
            ctx.beginPath();
            ctx.moveTo(data[0] * d - z * d2, data[1]);
            for (let i = 2; i < data.length; i+=2) {
                ctx.lineTo(data[i] * d - z * d2, data[i+1]);
            }
            if (fillColor) {
                ctx.fill();
            }
            ctx.stroke();
        }
    }

    ctx.setTransform(xfm);
}

function renderText(txt, x, y, color = '#fff', size = 30, align = 'left') {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.font = `bold ${size}px arial`;
    ctx.fillText(txt, x, y);
}

// Favicon
const ow = canvas.width, oh = canvas.height;
canvas.width = canvas.height = 64;
ctx.clearRect(0, 0, 64, 64);
renderMesh(headMeshAsset, 32, 48, 0, 0, 0);
let link = document.querySelector("link");
link.href = canvas.toDataURL();
canvas.width = ow; canvas.height = oh;

ctx.textBaseline = 'middle';
ctx.lineJoin = 'round';
ctx.lineCap = 'round';

export {
    canvas,
    ctx,
    color,
    renderMesh,
    renderText,
    scaleInPlace,
};