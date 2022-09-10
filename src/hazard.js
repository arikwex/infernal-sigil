import { renderMesh } from './canvas';
import { BoundingBox } from './bbox';
import { inView } from './utils';
import { TAG_ENEMY } from './tags';

const spikeMesh = [
  ['#f52', 6, 0],
];
for (let i = -50; i < 50; i+=26) {
  spikeMesh.push([i, 50, i + 10, 25, i+10, 140, i + 10, 25, i+20, 50]);
}
const lavaMesh = [
  ['#f82', 40, 0],
  [-47, 50, 47, 50]
];

const boundOX = [-45, -125, -45, 35];
const boundOY = [35, -45, -125, -45];

function Hazard(x, y, t) {
  let enemyHitbox;
  let extended = 0;
  let anim = Math.random();
  let rate = Math.random() + 0.5
  let placement = (Math.random() - 0.5) * 80;
  let targetExtended = 0;
  let phase = t < 4 ? 1 : 0;
  enemyHitbox = BoundingBox(x,y,boundOX[t % 4],boundOY[t % 4],90,90);

  function update(dT) {
    anim += dT * rate;
    if (anim > 1) {
      rate = Math.random() * 2 + 0.5;
      anim = 0;
      placement = (Math.random() - 0.5) * 80;
    }
    const q = (Date.now() + phase * 1500) % 3000;
    let dy = 0;
    if (t >= 4 && t <= 7) {
      targetExtended = (q > 1500) ? 1 : 0;
      if (targetExtended == 0 && q > 500) {
        dy = Math.cos(q/20)/20;
      }
    }
    extended += (targetExtended + dy - extended) * 15 * dT;
  }

  function render(ctx) {
    const dA = t * 1.57;
    const dx = Math.sin(dA) * extended * 91;
    const dy = -Math.cos(dA) * extended * 91;
    if (t == 8) {
      ctx.fillStyle = '#f82';
      ctx.beginPath();
      ctx.arc(x + placement, y + 50 - anim * 40, (anim - anim * anim) * 40, 0, 2 * Math.PI);
      ctx.fill();
      renderMesh(lavaMesh, x, y, 0, 0, 0);
    } else {
      renderMesh(spikeMesh, x + dx, y + dy, 0, 0, dA);
    }
    // Hack this in the render loop to save some bytes, ideally in update.
    enemyHitbox.x = x + dx;
    enemyHitbox.y = y + dy;
  }

  return {
    update,
    render,
    inView: (cx, cy) => inView(x, y, cx, cy),
    order: -6000,
    tags: [TAG_ENEMY],
    enemyHitbox
  }
}

export default Hazard;