import terrain from './game-map.png';
import { canvas } from './canvas';
import { add } from './engine';
import Wall from './wall';
import Decoration from './decoration';
import * as bus from './bus';
import LOOKUP from './GENERATED-map-lookup';

function Map() {
    let img = new Image();
    let data = null;
    let W, H;
    const BLOCK_SIZE = 100;
    const WALL_MAP = {};
    LOOKUP.map((entry, index) => {
        if (entry[0]) { WALL_MAP[index] = entry; }
    });

    let exactTheme = 0x000000;
    const themeLookup = {};

    async function generate() {
        await new Promise((r) => {
            img.onload = r;
            img.src = terrain;
        });

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
                const entityClass = LOOKUP[V*2];
                const entityData = LOOKUP[V*2+1];
                if (entityClass && !entityClass[0]) {
                    add(new entityClass(x * BLOCK_SIZE, y * BLOCK_SIZE, entityData));
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
                const V = get(x, y) << 1;
                if (WALL_MAP[V] && !vertMap[x+','+y]) {
                    let q = y;
                    while (q < H) {
                        const V2 = get(x, q) << 1;
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
                const V = WALL_MAP[get(x, y) << 1];
                const V2 = get(x, y-1);
                if (V && !V2 && Math.cos(x*1321+y*2831) > 0.5) {
                    add(new Decoration(x * BLOCK_SIZE, (y - 1) * BLOCK_SIZE, V[8][(x * 13 + y * 17) % V[8].length]));
                }
            }
        }

        // Place parallax objects
        // for (let x = 0; x < W; x++) {
        //     for (let y = 5; y < H; y++) {
        //         if (x > 40 || y < 60) { continue; }
        //         if (Math.abs(Math.cos(x*x*7321+y*y*4831))%1.0 < 0.1) {
        //             add(new Parallax(x * BLOCK_SIZE, y * BLOCK_SIZE));
        //         }
        //     }
        // }
    }

    function outlineFinder(x, y, ex, ey) {
        const right = [];
        const left = [];
        let drawing = [];
        let drawing2 = [];
        for (let i = y; i < ey; i++) {
            const sample = get(ex, i) << 1;
            if (!drawing.length && !WALL_MAP[sample]) {
                drawing.push((ex-x) * BLOCK_SIZE, (i-y) * BLOCK_SIZE);
            }
            if (drawing.length && WALL_MAP[sample]) {
                drawing.push((ex-x) * BLOCK_SIZE, (i-y) * BLOCK_SIZE);
                right.push(drawing);
                drawing = [];
            }

            const sample2 = get(x-1, i) << 1;
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
        return data[baseIdx + 2];
    }

    function computeTheme(x, y) {
        let avgTheme = [0, 0, 0, 0, 0, 0, null];
        const foundThemes = {};
        let N = 0.001;
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                const V = get(x + dx, y + dy) << 1;
                const wallData = WALL_MAP[V];
                if (wallData) {
                    foundThemes[V] = true;
                    for (let i = 0; i < 6; i++) {
                        avgTheme[i] += wallData[2 + i];
                    }
                    N++;
                }
            }
        }
        const keys = Object.keys(foundThemes);
        avgTheme = avgTheme.map((v) => v / N);
        if (keys.length == 1) {
            avgTheme[6] = keys[0];
        }
        return avgTheme;
    }

    let themeData = [0, 0, 0, 0, 0, 0, null];
    function getTheme(x, y) {
        const t = themeLookup[parseInt(x)]?.[parseInt(y)];
        if (t) {
            themeData = t;
            // Pure theme change detection
            if (t[6] && exactTheme != t[6]) {
                bus.emit('region', WALL_MAP[t[6]][9]);
                exactTheme = t[6];
            }
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