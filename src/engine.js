import { canvas, ctx, retainTransform } from './canvas';
import { TAG_CAMERA } from './tags';

let gameObjects = [];
let gameObjectsByTag = {};
const objectsToRemove = [];
let lastFrameMs = 0;
let startTime = 0;

function tick(currentFrameMs) {
    const dT = Math.min((currentFrameMs - lastFrameMs) * 0.001, 0.018);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    retainTransform(() => {
        const camera = getObjectsByTag(TAG_CAMERA)[0];
        camera.set(ctx);

        objectsToRemove.length = 0;
        gameObjects.map((g) => { if (g.update?.(dT)) { objectsToRemove.push(g); } });
        if (objectsToRemove.length) { remove(objectsToRemove); }
        gameObjects.map((g) => { if (g.inView(camera.x, camera.y)) { g.render?.(ctx); }});
        requestAnimationFrame(tick);
        lastFrameMs = currentFrameMs;
    });
}

function add(obj) {
    if (!obj.inView) { obj.inView=()=>1 }
    gameObjects.push(obj);
    gameObjects.sort((a, b) => (a.order || 0) - (b.order || 0));
    obj.tags?.map((tag) => {
        gameObjectsByTag[tag] = (gameObjectsByTag[tag] ?? []);
        gameObjectsByTag[tag].push(obj);
    });
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
    });
}

function clear() {
    gameObjects = [];
}

function start() {
    requestAnimationFrame(tick);
    startTime = Date.now();
}

function getObjectsByTag(tag) {
    return gameObjectsByTag[tag] || [];
}

function getStartTime() {
    return startTime;
}

export {
    start,

    add,
    remove,
    clear,
    getStartTime,

    getObjectsByTag,
};