import * as bus from './bus';
import { start, add, getObjectsByTag } from './engine';
import { addBones, addHp, respawn, setCheckpointId } from './gamestate';
import HUD from './hud';
import Map from './map';
import Camera from './camera';
import Bone from './bone';
import Fireball from './fireball';
import FlameSFX from './flame-sfx';
import Audio from './audio';
import { EVENT_ANY_KEY, EVENT_BONE_COLLECT, EVENT_BONE_SPAWN, EVENT_FIREBALL, EVENT_PLAYER_CHECKPOINT, EVENT_PLAYER_HIT, EVENT_PLAYER_RESET, EVENT_SFX_FLAME } from './events';
import { TAG_PLAYER } from './tags';

async function initialize() {
    // Loading
    bus.off(EVENT_ANY_KEY, initialize);
    const h1 = document.getElementsByTagName('h1')[0];
    h1.innerText='Loading...';
    await new Promise((r)=>setTimeout(r));

    // Game
    new Audio();

    const m = new Map();
    await m.generate();
    add(m);

    add(new Camera());
    add(new HUD());

    // FOR DEVELOPMENT
    // getObjectsByTag(TAG_PLAYER)[0].grant(0);
    // getObjectsByTag(TAG_PLAYER)[0].grant(1);
    // getObjectsByTag(TAG_PLAYER)[0].grant(2);
    // getObjectsByTag(TAG_PLAYER)[0].grant(3);

    // Game events
    bus.on(EVENT_BONE_SPAWN, ([x,y,N,t]) => { while(N-->0){ add(new Bone(x,y,(Math.random()-0.5)*400,(-Math.random())*300-200,t)); } });
    bus.on(EVENT_BONE_COLLECT, (v) => addBones(v));
    bus.on(EVENT_PLAYER_HIT, (v) => addHp(-v));
    bus.on(EVENT_PLAYER_CHECKPOINT, (v) => setCheckpointId(v));
    bus.on(EVENT_PLAYER_RESET, (v) => respawn());
    bus.on(EVENT_FIREBALL, ([x, y, dir]) => add(new Fireball(x, y, dir)));
    bus.on(EVENT_SFX_FLAME, ([x, y, s, t]) => add(new FlameSFX(x, y, s, t)));

    h1.remove();
    start();
}

bus.on(EVENT_ANY_KEY, initialize);
