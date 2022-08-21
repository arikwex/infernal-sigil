import { renderMesh } from './canvas';
import { start, add } from './engine';
import Player from './player';

start();
add({ render: (ctx) => { renderMesh([['#fff', 8, 0], [0,300,800,300]], 0, -1, 0, 0, 0); }})
add(new Player(400, 300));