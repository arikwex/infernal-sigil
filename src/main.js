import { renderMesh } from './canvas';
import { start, add, addPhysics } from './engine';
import Player from './player';
import { WallPhysics } from './wall';

start();
// add({ render: (ctx) => { renderMesh([['#fff', 8, 0], [0,300,800,300]], 0, -1, 0, 0, 0); }})
add(new Player(200, 200));

addPhysics(new WallPhysics(0, 300, 300, 40));
addPhysics(new WallPhysics(400, 240, 300, 40));