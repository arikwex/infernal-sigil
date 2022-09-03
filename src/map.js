import terrain from './game-map.png';
import { canvas } from './canvas';
import { add } from './engine';
import Player from './player';
import Camera from './camera';
import Skeleton from './skeleton';
import Spider from './spider';
import Treasure from './treasure';
import Wall from './wall';
import Hazard from './hazard';
import Gate from './gate';
import Switch from './switch';
import Shrine from './shrine';
import Web from './web';
import Decoration from './decoration';
import Parallax from './parallax';
import Checkpoint from './checkpoint';

function Map() {
    let img = new Image();
    let data = null;
    let W, H;
    const BLOCK_SIZE = 100;
    const WALL_MAP = {
      [0xffffff]: ['#a99', '#433', 50, 10, 40, 90, 20, 10, [0, 0, 0, 1, 3]],
      [0x64ff64]: ['#474', '#242', 20, 30, 10, 10, 50, 40, [2, 2, 2, 0]],
      [0xff80ff]: ['#b5c', '#535', 70, 70, 40, 20, 10, 20, [1, 1, 1, 3, 0]],
      [0xff800a]: ['#b72', '#741', 10, 20, 70, 70, 50, 30, [3, 3, 1, 2, 0]],
    };
    const themeLookup = {};

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

        // Character placements
        for (let x = 0; x < W; x++) {
            for (let y = 0; y < H; y++) {
                const V = get(x, y);
                const D0 = (V >> 16) & 0xff;
                const D1 = (V >> 8) & 0xff;
                const D2 = V & 0xff;
                // PLAYER
                if (V == 0x00ff00) {
                    add(new Player(x * BLOCK_SIZE, y * BLOCK_SIZE));
                    add(new Camera(x * BLOCK_SIZE, y * BLOCK_SIZE));
                }
                // ENEMIES + HAZARDS
                if (D0 == 0xff) {
                    if (D1 == 0x00) { add(new Skeleton(x * BLOCK_SIZE, y * BLOCK_SIZE, D2)); }
                    if (D1 == 0x01) { add(new Hazard(x * BLOCK_SIZE, y * BLOCK_SIZE, D2)); }
                    if (D1 == 0x02) { add(new Spider(x * BLOCK_SIZE, y * BLOCK_SIZE, D2)); }
                }
                // GAME FLOW
                if (D2 == 0xff) {
                    if (D0 == 0x00) { add(new Treasure(x * BLOCK_SIZE, (y + 0.5) * BLOCK_SIZE, D1)); }
                    if (D0 == 0x01) { add(new Switch(x * BLOCK_SIZE, y * BLOCK_SIZE, 0, D1)); }
                    if (D0 == 0x02) { add(new Switch(x * BLOCK_SIZE, y * BLOCK_SIZE, 1, D1)); }
                    if (D0 == 0x03) { add(new Gate(x * BLOCK_SIZE, y * BLOCK_SIZE, D1)); }
                    if (D0 == 0x04) {
                        add(new Shrine(x * BLOCK_SIZE, y * BLOCK_SIZE, D1));
                        add(new Decoration((x - 2.5) * BLOCK_SIZE, y * BLOCK_SIZE, 0));
                        add(new Decoration((x + 2.5) * BLOCK_SIZE, y * BLOCK_SIZE, 0));
                    }
                    if (D0 == 0x05) { add(new Web(x * BLOCK_SIZE, y * BLOCK_SIZE)); }
                    if (D0 == 0x06) { add(new Checkpoint(x * BLOCK_SIZE, y * BLOCK_SIZE, D1)); }
                }

                // compute theme avg
                themeLookup[x] = themeLookup[x] || {};
                themeLookup[x][y] = computeTheme(x, y);
            }
        }

        // Merge walls vertically
        const vertMap = {};
        for (let x = 0; x < W; x++) {
            for (let y = 0; y < H; y++) {
                const V = get(x, y);
                if (WALL_MAP[V] && !vertMap[x+','+y]) {
                    let q = y;
                    while (q < H) {
                        const V2 = get(x, q);
                        if (V != V2) {
                            break;
                        }
                        vertMap[x+','+q] = true;
                        q++;
                    }
                    vertMap[x+','+y] = [y, q, V];
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
                        if (vm2[1] != vm[1] || vm2[2] != vm[2]) {
                            break;
                        }
                        horizMap[q+','+y] = true;
                        q++;
                    }
                    // scan adjacent surface nodes and mark them for skipping
                    let o = outlineFinder(x, y, q, vm[1]);
                    add(new Wall(x, y, q, vm[1], o, BLOCK_SIZE, WALL_MAP[vm[2]]));
                }
            }
        }

        // Place decorations
        for (let x = 0; x < W; x++) {
            for (let y = 1; y < H; y++) {
                const V = WALL_MAP[get(x, y)];
                const V2 = get(x, y-1);
                if (V && !V2 && Math.cos(x*1321+y*2831) > 0.5) {
                    add(new Decoration(x * BLOCK_SIZE, (y - 1) * BLOCK_SIZE, V[8][(x * 13 + y * 17) % V[8].length]));
                }
            }
        }

        // Place parallax objects
        for (let x = 0; x < W; x++) {
            for (let y = 5; y < H; y++) {
                if (x > 40 || y < 60) { continue; }
                if (Math.abs(Math.cos(x*x*7321+y*y*4831))%1.0 < 0.1) {
                    add(new Parallax(x * BLOCK_SIZE, y * BLOCK_SIZE));
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
            if (!drawing.length && !WALL_MAP[sample]) {
                drawing.push((ex-x) * BLOCK_SIZE, (i-y) * BLOCK_SIZE);
            }
            if (drawing.length && WALL_MAP[sample]) {
                drawing.push((ex-x) * BLOCK_SIZE, (i-y) * BLOCK_SIZE);
                right.push(drawing);
                drawing = [];
            }

            const sample2 = get(x-1, i);
            if (!drawing2.length && !WALL_MAP[sample2]) {
                drawing2.push(0, (i-y) * BLOCK_SIZE);
            }
            if (drawing2.length && WALL_MAP[sample2]) {
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

    function computeTheme(x, y) {
        const avgTheme = [0, 0, 0, 0, 0, 0];
        let N = 0.001;
        for (let dx = -8; dx <= 8; dx++) {
            for (let dy = -8; dy <= 8; dy++) {
                const V = get(x + dx, y + dy);
                const wallData = WALL_MAP[V];
                if (wallData) {
                    for (let i = 0; i < 6; i++) {
                        avgTheme[i] += wallData[2 + i];
                    }
                    N++;
                }
            }
        }
        return avgTheme.map((v) => v / N);
    }

    let themeData = [0, 0, 0, 0, 0, 0];
    function getTheme(x, y) {
        const t = themeLookup[parseInt(x)]?.[parseInt(y)];
        if (t) {
            themeData = t;
        }
        return themeData;
    }

    return {
        generate,
        tags: ['map'],
        getTheme,
    }
}

export default Map;