import * as bus from './bus';
import { start, add, getObjectsByTag } from './engine';
import { getCurrentGameState } from './gamestate';
import HUD from './hud';
import Map from './map';
import Bone from './bone';
import Fireball from './fireball';
import FlameSFX from './flame-sfx';
import Checkpoint from './checkpoint';

async function initialize() {
    const m = new Map();
    await m.generate();
    add(m);
    add(new HUD());

    add(new Checkpoint(100*32, 100*62, 0));
    add(new Checkpoint(100*28, 100*62, 1));
    getObjectsByTag('player')[0].grant(0);
    getObjectsByTag('player')[0].grant(1);
    getObjectsByTag('player')[0].grant(2);

    // Game events
    bus.on('bone:spawn', ([x,y,N,t]) => { while(N-->0){ add(new Bone(x,y,(Math.random()-0.5)*400,(-Math.random())*300-200,t)); } });
    bus.on('bone:collect', (v) => getCurrentGameState().addBones(v));
    bus.on('player:hit', (v) => getCurrentGameState().addHp(-v));
    bus.on('player:cpt', (v) => getCurrentGameState().setCheckpointId(v));
    bus.on('player:rst', (v) => getCurrentGameState().respawn());
    bus.on('fireball', ([x, y, dir]) => add(new Fireball(x, y, dir)));
    bus.on('sfx:flame', ([x, y, s, t]) => add(new FlameSFX(x, y, s, t)));

    start();
}

initialize();