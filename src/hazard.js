import { renderMesh } from './canvas';
import { BoundingBox } from './bbox';

const spikeMesh = [
  ['#f52', 6, 0],
];
for (let i = -50; i < 50; i+=26) {
  spikeMesh.push([i, 50, i + 10, 25, i+10, 150, i + 10, 25, i+20, 50]);
}

function Hazard(x, y, t) {
  let enemyHitbox;
  let extended = 0;
  let targetExtended = 0;
  if (t%4 == 0) { enemyHitbox = new BoundingBox(x,y,-45,35,90,90); }
  if (t%4 == 1) { enemyHitbox = new BoundingBox(x,y,-125,-45,90,90); }
  if (t%4 == 2) { enemyHitbox = new BoundingBox(x,y,-45,-125,90,90); }
  if (t%4 == 3) { enemyHitbox = new BoundingBox(x,y,35,-45,90,90); }

  function update(dT) {
    const q = Date.now() % 3000;
    let dy = 0;
    targetExtended = (q > 1500) ? 1 : 0;
    if (targetExtended == 0 && q > 500) {
      dy = Math.cos(q/20)/20;
    }
    extended += (targetExtended + dy - extended) * 15 * dT;
  }

  function render(ctx) {
    const dA = t * 1.57;
    const dx = Math.sin(dA) * extended * 100;
    const dy = -Math.cos(dA) * extended * 100;
    renderMesh(spikeMesh, x + dx, y + dy, 0, 0, dA);
    // Hack this in the render loop to save some bytes, ideally in update.
    enemyHitbox.x = x + dx;
    enemyHitbox.y = y + dy;
  }

  return {
    update,
    render,
    order: -6000,
    tags: ['enemy'],
    enemyHitbox
  }
}

export default Hazard;