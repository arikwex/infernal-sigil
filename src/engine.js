import { canvas, ctx } from './canvas';

let gameObjects = [];
let gameObjectsByTag = {};
const objectsToRemove = [];
let lastFrameMs = 0;

function tick(currentFrameMs) {
    const dT = Math.min((currentFrameMs - lastFrameMs) * 0.001, 0.018);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const originalXfm = ctx.getTransform();
    const camera = getObjectsByTag('camera')[0];
    const cx = camera.getX();
    const cy = camera.getY();
    camera.set(ctx);

    objectsToRemove.length = 0;
    gameObjects.map((g) => { if (g.update?.(dT)) { objectsToRemove.push(g); } });
    if (objectsToRemove.length > 0) { remove(objectsToRemove); }
    gameObjects.map((g) => { if (g.inView(cx, cy)) { g.render?.(ctx); }});
    requestAnimationFrame(tick);
    lastFrameMs = currentFrameMs;

    ctx.setTransform(originalXfm);
}

function add(obj) {
    if (!obj.inView) { obj.inView=()=>1 }
    gameObjects.push(obj);
    gameObjects.sort((a, b) => (a.order || 0) - (b.order || 0));
    obj.tags?.map((tag) => {
        gameObjectsByTag[tag] = (gameObjectsByTag[tag] ?? []);
        gameObjectsByTag[tag].push(obj);
    });
    obj.enable?.();
}

function arrayRemove(list, valuesToEvict) {
    return list.filter((g) => !valuesToEvict.includes(g));
}

function remove(objList) {
    gameObjects = arrayRemove(gameObjects, objList);
    objList.map((obj) => {
        obj.tags?.map((tag) => {
            gameObjectsByTag[tag] = arrayRemove(gameObjectsByTag[tag], [obj]);
        });
        obj.disable?.();
    });
}

function clear() {
    gameObjects = [];
}

function start() {
    requestAnimationFrame(tick);
}

function getGameObjects() {
    return gameObjects;
}

function getObjectsByTag(tag) {
    return gameObjectsByTag[tag] || [];
}

export {
    start,

    add,
    remove,
    clear,

    getGameObjects,
    getObjectsByTag,
};