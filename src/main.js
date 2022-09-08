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
import { EVENT_BONE_COLLECT, EVENT_FIREBALL, EVENT_PLAYER_HIT } from './events';

async function initialize() {
    // Game
    new Audio();

    const m = new Map();
    await m.generate();
    add(m);

    add(new Camera());
    add(new HUD());

    // FOR DEVELOPMENT
    // getObjectsByTag('player')[0].grant(0);
    // getObjectsByTag('player')[0].grant(1);
    // getObjectsByTag('player')[0].grant(2);
    // getObjectsByTag('player')[0].grant(3);

    // Game events
    bus.on('bone:spawn', ([x,y,N,t]) => { while(N-->0){ add(new Bone(x,y,(Math.random()-0.5)*400,(-Math.random())*300-200,t)); } });
    bus.on(EVENT_BONE_COLLECT, (v) => addBones(v));
    bus.on(EVENT_PLAYER_HIT, (v) => addHp(-v));
    bus.on('player:cpt', (v) => setCheckpointId(v));
    bus.on('player:rst', (v) => respawn());
    bus.on(EVENT_FIREBALL, ([x, y, dir]) => add(new Fireball(x, y, dir)));
    bus.on('sfx:flame', ([x, y, s, t]) => add(new FlameSFX(x, y, s, t)));

    start();
}

initialize();