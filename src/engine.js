import { canvas, ctx } from './canvas';

let gameObjects = [];
let physicsObjects = [];
let lastFrameMs = 0;

function tick(currentFrameMs) {
    const dT = Math.min((currentFrameMs - lastFrameMs) * 0.001, 0.5);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    gameObjects.map((g) => { g.update?.(dT, gameObjects, physicsObjects); });
    gameObjects.map((g) => { g.render?.(ctx); });
    requestAnimationFrame(tick);
    lastFrameMs = currentFrameMs;
}

function add(obj) {
    gameObjects.push(obj);
}

function remove(obj) {
    gameObjects = gameObjects.filter((g) => g != obj);
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