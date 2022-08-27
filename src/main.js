import * as bus from './bus';
import { start, add } from './engine';
import Bone from './bone';
import { getCurrentGameState } from './gamestate';
import HUD from './hud';
import Map from './map';

import Treasure from './treasure';

async function initialize() {
    const m = new Map();
    await m.generate();
    add(m);
    add(new HUD());

    add(new Treasure(100*47, 100*(72+0.5), 1));
    add(new Treasure(100*50, 100*(72+0.5), 2));
    add(new Treasure(100*54, 100*(71+0.5), 3));

    // Game events
    bus.on('bone:spawn', ([x,y,N,t]) => {
        while(N-->0){ add(new Bone(x,y,(Math.random()-0.5)*400,(-Math.random())*300-200,t)); }
    });
    bus.on('bone:collect', (v) => getCurrentGameState().addBones(v));
    bus.on('player:hit', (v) => getCurrentGameState().addHp(-v));

    start();
}

initialize();