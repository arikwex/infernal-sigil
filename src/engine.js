import { ctx } from './canvas';

let gameObjects = [];
let lastFrameMs = 0;

function tick(currentFrameMs) {
    const dT = (currentFrameMs - lastFrameMs) * 0.001;
    gameObjects.map((g) => { g.update(dT); });
    gameObjects.map((g) => { g.render(dT); });
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

export {
    start,
    add,
    remove,
    clear,
};