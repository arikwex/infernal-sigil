import { canvas, ctx } from './canvas';

let gameObjects = [];
let physicsObjects = [];
const objectsToRemove = [];
let lastFrameMs = 0;

function tick(currentFrameMs) {
    const dT = Math.min((currentFrameMs - lastFrameMs) * 0.001, 0.5);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    
    const cameraXfm = ctx.getTransform();
    ctx.translate(270, 100);
    // ctx.scale(0.7, 0.7);

    objectsToRemove.length = 0;
    gameObjects.map((g) => { if (g.update?.(dT, gameObjects, physicsObjects)) { objectsToRemove.push(g); } });
    if (objectsToRemove.length > 0) { remove(objectsToRemove); }
    gameObjects.map((g) => { g.render?.(ctx); });
    requestAnimationFrame(tick);
    lastFrameMs = currentFrameMs;

    ctx.setTransform(cameraXfm);
}

function add(obj) {
    gameObjects.push(obj);
    gameObjects.sort((a, b) => a.order - b.order);
}

function remove(objList) {
    gameObjects = gameObjects.filter((g) => !objList.includes(g));
}

function clear() {
    gameObjects = [];
}

function start() {
    requestAnimationFrame(tick);
}

function addPhysics(obj) {
    physicsObjects.push(obj);
}

export {
    start,
    
    add,
    remove,
    clear,

    addPhysics,
};