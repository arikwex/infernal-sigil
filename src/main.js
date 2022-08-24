import { renderMesh } from './canvas';
import { start, add } from './engine';
import Player from './player';
import Skeleton from './skeleton';
import { BoundingBox } from './bbox';

start();
// add({ render: (ctx) => { renderMesh([['#fff', 8, 0], [0,300,800,300]], 0, -1, 0, 0, 0); }})
add(new Player(150, 400));
add(new Skeleton(400, 439))

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
add({ tags: ['physics'], physics: new BoundingBox(0, 440, 800, 100) });
add({ tags: ['physics'], physics: new BoundingBox(650, 100, 100, 340) });