import { BoundingBox } from "./bbox";
import { renderMesh } from "./canvas";
import { add } from "./engine";

function Shrine(x, y, t) {
    const platformMesh = [
        ['#777', 5, 0],
        [200, 60, -200, 60, -200, 0, -100, 0, -100, -50, 100, -50, 100, 0, 200, 0, 200, 60]
    ];
    const bloodMesh = [
        ['#911', 10, 0],
        [-100, -40, -100, -50, 100, -50, 100, -25],
        [-70, -50, -70, -25],
        [40, -50, 40, -15],
        [60, -50, 60, -35],
    ];
    const physics = new BoundingBox(x-200,y,0,0,400,50);
    const secondPhysics = { tags: ['physics'], physics: new BoundingBox(x-100,y-50,0,0,200,50) };

    function update(dT) {

    }

    function render(ctx) {
        renderMesh(platformMesh, x, y, 0, 0, 0, '#777');
        renderMesh(bloodMesh, x, y, 0, 0, 0);
    }

    function enable() {
        add(secondPhysics);
    }

    function disable() {
        remove(secondPhysics);
    }

    return {
        update,
        render,
        enable,
        disable,
        tags: ['physics'],
        physics,
        order: -8000
    };
}

export default Shrine;