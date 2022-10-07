import { canvas, ctx, retainTransform } from './canvas';
import { updateGameControls } from './controls';
import { TAG_CAMERA } from './tags';

let gameObjects = [];
let gameObjectsByTag = {};
const objectsToRemove = [];
let lastFrameMs = 0;
let startTime = 0;
let startInvoked = false;

function tick(currentFrameMs) {
    updateGameControls();
    if (!startInvoked) { requestAnimationFrame(tick); return; }
    
    const dT = Math.min((currentFrameMs - lastFrameMs) * 0.001, 0.018);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    retainTransform(() => {
        const camera = getObjectsByTag(TAG_CAMERA)[0];
        if (camera) {
            camera.set(ctx);
        }

        objectsToRemove.length = 0;
        gameObjects.map((g) => { if (g.update?.(dT)) { objectsToRemove.push(g); } });
        if (objectsToRemove.length) { remove(objectsToRemove); }
        if (camera) {
            gameObjects.map((g) => { if (g.inView(camera.x, camera.y)) { g.render?.(ctx); }});
        } else {
            gameObjects.map((g) => { g.render?.(ctx); });
        }
        lastFrameMs = currentFrameMs;
    });
    requestAnimationFrame(tick);
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
    startInvoked = true;
    startTime = Date.now();
}

function getObjectsByTag(tag) {
    return gameObjectsByTag[tag] || [];
}

function getStartTime() {
    return startTime;
}

requestAnimationFrame(tick);

export {
    start,

    add,
    remove,
    clear,
    getStartTime,

    getObjectsByTag,
};