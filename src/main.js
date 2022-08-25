import * as bus from './bus';
import { start, add } from './engine';
import Player from './player';
import Skeleton from './skeleton';
import { BoundingBox } from './bbox';
import Bone from './bone';
import { getCurrentGameState } from './gamestate';
import HUD from './hud';

function initialize() {
    start();
    add(new Player(150, 400));
    add(new Skeleton(500, 439));
    add(new Bone(300, 300, 0, 0));
    add(new HUD());

    // ISLANDS LAYOUT
    // addPhysics(new BoundingBox(0, 440, 300, 100));
    // addPhysics(new BoundingBox(400, 440, 300, 100));
    // addPhysics(new BoundingBox(100, 140, 100, 200));
    // addPhysics(new BoundingBox(500, 140, 100, 300));

    // NOOK LAYOUT
    // addPhysics(new BoundingBox(0, 440, 800, 100));
    // addPhysics(new BoundingBox(350, 100, 100, 340));
    // addPhysics(new BoundingBox(0, 100, 350, 100));

    // L-SHAPE LAYOUT
    add({ tags: ['physics'], physics: new BoundingBox(0, 440, 0, 0, 800, 100) });
    add({ tags: ['physics'], physics: new BoundingBox(650, 100, 0, 0, 100, 340) });
    add({ tags: ['physics'], physics: new BoundingBox(250, 340, 0, 0, 100, 100) });

    // Game events
    bus.on('bone:spawn', ([x,y,N]) => {
        while(N-->0){ add(new Bone(x,y,(Math.random()-0.5)*400,(-Math.random())*300-200)); }
    });
    bus.on('bone:collect', (v) => getCurrentGameState().addBones(v));
    bus.on('player:hit', (v) => getCurrentGameState().addHp(-v));
}

initialize();