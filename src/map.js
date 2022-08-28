import terrain from './game-map.png';
import { canvas } from './canvas';
import { add, getObjectsByTag } from './engine';
import { BoundingBox } from './bbox';
import Player from './player';
import Camera from './camera';
import Skeleton from './skeleton';
import Treasure from './treasure';
import Wall from './wall';

function Map() {
    let img = new Image();
    let data = null;
    let W, H;
    const BLOCK_SIZE = 100;

    async function generate() {
        await new Promise((r) => {
            img.onload = r;
            img.src = terrain;
        });

        //
        let context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        W = img.width;
        H = img.height;
        data = context.getImageData(0, 0, W, H).data;
        context.clearRect(0, 0, W, H);
        console.log(data);

        // Character placements
        for (let x = 0; x < W; x++) {
            for (let y = 0; y < H; y++) {
                const V = get(x, y);
                const D0 = (V >> 16) & 0xff;
                const D1 = (V >> 8) & 0xff;
                const D2 = V & 0xff;
                if (V == 0x00ff00) {
                    add(new Player(x * BLOCK_SIZE, y * BLOCK_SIZE));
                    add(new Camera(x * BLOCK_SIZE, y * BLOCK_SIZE));
                }
                if (V == 0xff0000) {
                    add(new Skeleton(x * BLOCK_SIZE, y * BLOCK_SIZE));
                }
                if (D0 == 0x00 && D2 == 0xff) {
                    add(new Treasure(x * BLOCK_SIZE, (y + 0.5) * BLOCK_SIZE, D1));
                }
            }
        }

        // Merge walls vertically
        const vertMap = {};
        for (let x = 0; x < W; x++) {
            for (let y = 0; y < H; y++) {
                const V = get(x, y);
                if (V == 0xffffff && !vertMap[x+','+y]) {
                    let q = y;
                    while (q < H) {
                        const V2 = get(x, q);
                        if (V2 != 0xffffff) {
                            break;
                        }
                        vertMap[x+','+q] = true;
                        q++;
                    }
                    vertMap[x+','+y] = [y, q];
                }
            }
        }

        // Merge walls horizontally
        const horizMap = {};
        for (let x = 0; x < W; x++) {
            for (let y = 0; y < H; y++) {
                const vm = vertMap[x+','+y];
                if (vm?.length && !horizMap[x+','+y]) {
                    let q = x;
                    while (q < W) {
                        const vm2 = vertMap[q+','+y];
                        if (!vm2?.length) {
                            break;
                        }
                        if (vm2[1] != vm[1]) {
                            break;
                        }
                        horizMap[q+','+y] = true;
                        q++;
                    }
                    // scan adjacent surface nodes and mark them for skipping
                    let o = outlineFinder(x, y, q, vm[1]);
                    add(new Wall(x, y, q, vm[1], o, BLOCK_SIZE));
                }
            }
        }
    }

    function outlineFinder(x, y, ex, ey) {
        const right = [];
        const left = [];
        let drawing = [];
        let drawing2 = [];
        for (let i = y; i < ey; i++) {
            const sample = get(ex, i);
            if (!drawing.length && sample != 0xffffff) {
                drawing.push((ex-x) * BLOCK_SIZE, (i-y) * BLOCK_SIZE);
            }
            if (drawing.length && sample == 0xffffff) {
                drawing.push((ex-x) * BLOCK_SIZE, (i-y) * BLOCK_SIZE);
                right.push(drawing);
                drawing = [];
            }

            const sample2 = get(x-1, i);
            if (!drawing2.length && sample2 != 0xffffff) {
                drawing2.push(0, (i-y) * BLOCK_SIZE);
            }
            if (drawing2.length && sample2 == 0xffffff) {
                drawing2.push(0, (i-y) * BLOCK_SIZE);
                left.push(drawing2);
                drawing2 = [];
            }
        }

        if (drawing.length) {
            drawing.push((ex-x) * BLOCK_SIZE, (ey-y) * BLOCK_SIZE);
            right.push(drawing);
        }
        if (drawing2.length) {
            drawing2.push(0, (ey-y) * BLOCK_SIZE);
            left.push(drawing2);
        }

        return [right, left];
    }

    function get(x, y) {
        const baseIdx = (x + y * W) << 2;
        return (data[baseIdx] << 16) | (data[baseIdx + 1] << 8) | data[baseIdx + 2]
    }

    return {
        generate
    }
}

export default Map;