import { renderMesh } from './canvas';
import { start, add } from './engine';
import Player from './player';

start();
add(new Player(400, 300));
add({ render: (ctx) => { renderMesh([['#fff', 8, 0], [0,300,800,300]], 0, 0, 0, 0, 0); }})