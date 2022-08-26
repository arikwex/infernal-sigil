import * as bus from './bus';
import { start, add } from './engine';
import Player from './player';
import Skeleton from './skeleton';
import { BoundingBox } from './bbox';
import Bone from './bone';
import { getCurrentGameState } from './gamestate';
import HUD from './hud';
import Camera from './camera';
import Map from './map';

async function initialize() {
    const m = new Map();
    
    const player = new Player(150, 400);
    add(player);
    
    await m.generate();
    add(m);
    add(new Camera(player.playerHitbox.x, player.playerHitbox.y));

    add(new Skeleton(500, 439));
    // add(new Skeleton(300, 339));
    // add(new Skeleton(400, 239));
    add(new Bone(300, 300, 0, 0));
    add(new HUD());

    // L-SHAPE LAYOUT
    add({ tags: ['physics'], physics: new BoundingBox(0, 440, 0, 0, 800, 100) });
    add({ tags: ['physics'], physics: new BoundingBox(650, 100, 0, 0, 100, 340) });
    add({ tags: ['physics'], physics: new BoundingBox(250, 340, 0, 0, 100, 100) });

    // ISLANDS LAYOUT
    add({ tags: ['physics'], physics: new BoundingBox(0+1000, 440, 0, 0, 300, 100) });
    add({ tags: ['physics'], physics: new BoundingBox(400+1000, 440, 0, 0, 300, 100) });
    add({ tags: ['physics'], physics: new BoundingBox(100+1000, 140, 0, 0, 100, 200) });
    add({ tags: ['physics'], physics: new BoundingBox(500+1000, 140, 0, 0, 100, 300) });

    // NOOK LAYOUT
    add({ tags: ['physics'], physics: new BoundingBox(0+1000*2, 440, 0, 0, 800, 100) });
    add({ tags: ['physics'], physics: new BoundingBox(350+1000*2, 100, 0, 0, 100, 340) });
    add({ tags: ['physics'], physics: new BoundingBox(0+1000*2, 100, 0, 0, 350, 100) });

    // Game events
    bus.on('bone:spawn', ([x,y,N]) => {
        while(N-->0){ add(new Bone(x,y,(Math.random()-0.5)*400,(-Math.random())*300-200)); }
    });
    bus.on('bone:collect', (v) => getCurrentGameState().addBones(v));
    bus.on('player:hit', (v) => getCurrentGameState().addHp(-v));

    start();
}

initialize();