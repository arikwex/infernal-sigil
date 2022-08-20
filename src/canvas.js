const canvas = document.getElementsByTagName('canvas')[0];
canvas.width = 800;
canvas.height = 600;
const ctx = canvas.getContext('2d');

export {
    canvas,
    ctx,
};