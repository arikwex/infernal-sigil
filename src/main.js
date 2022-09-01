import * as bus from './bus';
import { start, add, getObjectsByTag } from './engine';
import { getCurrentGameState } from './gamestate';
import HUD from './hud';
import Map from './map';
import Bone from './bone';
import Fireball from './fireball';

import Shrine from './shrine';

async function initialize() {
    const m = new Map();
    await m.generate();
    add(m);
    add(new HUD());

    add(new Shrine(100*27, 100*66, 0));
    getObjectsByTag('player')[0].grant(0);
    getObjectsByTag('player')[0].grant(1);
    getObjectsByTag('player')[0].grant(2);

    // Game events
    bus.on('bone:spawn', ([x,y,N,t]) => {
        while(N-->0){ add(new Bone(x,y,(Math.random()-0.5)*400,(-Math.random())*300-200,t)); }
    });
    bus.on('bone:collect', (v) => getCurrentGameState().addBones(v));
    bus.on('player:hit', (v) => getCurrentGameState().addHp(-v));
    bus.on('fireball', ([x, y, dir]) => add(new Fireball(x, y, dir)));

    start();
}

initialize();