import terrain from './game-map.png';
import { ctx } from './canvas';
import { add, getObjectsByTag } from './engine';
import Wall from './wall';
import Decoration from './decoration';
import * as bus from './bus';
import LOOKUP from './GENERATED-map-lookup';
import { EVENT_REGION } from './events';
import { TAG_CAMERA, TAG_MAP } from './tags';
import Treasure from './treasure';
import Web from './web';
import Gate from './gate';

function Map() {
    let m = document.createElement('canvas');
    let minimapCtx;
    let data;
    let W, H;
    const BLOCK_SIZE = 100;
    const WALL_MAP = {};
    LOOKUP.map((entry, index) => {
        if (entry[0]) { WALL_MAP[index] = entry; }
    });

    let exactTheme = 0;
    const themeLookup = {};

    async function generate() {
        // Extract map data
        W = terrain.width; H = terrain.height;
        data = Array.from(terrain.data);

        // Prepare minimap
        m.width = m.height = 128;
        minimapCtx = m.getContext('2d');

        // Entity placements
        forXY((x, y) => {
            const V = get(x, y);
            const entityClass = LOOKUP[V*2];
            const entityData = LOOKUP[V*2+1];
            if (entityClass && !entityClass[0]) {
                add(entityClass(x * BLOCK_SIZE, y * BLOCK_SIZE, entityData));
            }

            // compute theme avg
            themeLookup[x] = themeLookup[x] || {};
            themeLookup[x][y] = computeTheme(x, y);
        });

        // Merge walls vertically
        const vertMap = {};
        forXY((x, y) => {
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
        });

        // Merge walls horizontally
        const horizMap = {};
        forXY((x, y) => {
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
                add(Wall(x, y, q, vm[1], o, BLOCK_SIZE, WALL_MAP[vm[2]]));
            }
        });

        // Place decorations
        forXY((x, y) => {
            const V = WALL_MAP[get(x, y) << 1];
            if (V && !get(x, y-1) && Math.cos(x*1321+y*2831) > 0.5) {
                add(Decoration(x * BLOCK_SIZE, (y - 1) * BLOCK_SIZE, V[8][(x * 13 + y * 17) % V[8].length]));
            }
        });
    }

    function forXY(fn) {
        for (let x = 0; x < W; x++) {
            for (let y = 0; y < H; y++) {
                fn(x, y);
            }
        }
    }

    function outlineFinder(x, y, ex, ey) {
        const right = [];
        const left = [];
        let drawing = [];
        let drawing2 = [];

        for (let i = y; i < ey; i++) {
            const sample = get(ex, i) << 1;
            if (!drawing.length && !WALL_MAP[sample]) {
                drawing.push((ex-x), (i-y));
            }
            if (drawing.length && WALL_MAP[sample]) {
                drawing.push((ex-x), (i-y));
                right.push(drawing.map((v) => v * BLOCK_SIZE));
                drawing = [];
            }

            const sample2 = get(x-1, i) << 1;
            if (!drawing2.length && !WALL_MAP[sample2]) {
                drawing2.push(0, (i-y));
            }
            if (drawing2.length && WALL_MAP[sample2]) {
                drawing2.push(0, (i-y));
                left.push(drawing2.map((v) => v * BLOCK_SIZE));
                drawing2 = [];
            }
        }

        if (drawing.length) {
            drawing.push((ex-x), (ey-y));
            right.push(drawing.map((v) => v * BLOCK_SIZE));
        }
        if (drawing2.length) {
            drawing2.push(0, (ey-y));
            left.push(drawing2.map((v) => v * BLOCK_SIZE));
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
        for (let q = 0; q < 49; q++) {
            const V = get(x + parseInt(q / 7 - 3), y + q % 7 - 3) << 1;
            const wallData = WALL_MAP[V];
            if (wallData) {
                foundThemes[V] = true;
                for (let i = 0; i < 6; i++) {
                    avgTheme[i] += wallData[2 + i];
                }
                N++;
            }
        }
        const keys = Object.keys(foundThemes);
        avgTheme = avgTheme.map((v) => v * 10 / N);
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
                bus.emit(EVENT_REGION, WALL_MAP[t[6]][9]);
                exactTheme = t[6];
            }
        }
        return themeData;
    }

    function update() {
        const cam = getObjectsByTag(TAG_CAMERA)[0];
        for (let q = 0; q < 15*10; q++) {
            const x = parseInt(cam.x/100 + q % 15 - 7);
            const y = parseInt(cam.y/100) + parseInt(q / 15) - 4;
            const V = get(x, y) << 1;
            // Find walls
            if (WALL_MAP[V] && x < 125) { d(x, y, WALL_MAP[V][0]); }
            // Find treasure
            if (LOOKUP[V] == Treasure) { d(x, y, '#ff0'); }
            // Find Web
            if (LOOKUP[V] == Web) { [0,1].map((v)=>d(x, y-v, '#24f')); }
            // Find Gate
            if (LOOKUP[V] == Gate) { [0,1,2].map((v)=>d(x, y-v, '#24f')); }
        }
    }

    // Draw on minimap
    function d(x,y,c) {
        minimapCtx.fillStyle=c;
        // Write it to the minimap, then erase it from the datastore
        data[(x + y * W)*4 + 2] = 0;
        if (c) {
            minimapCtx.fillRect( x, y, 1, 1 );
        } else {
            minimapCtx.clearRect( x, y, 1, 1 );
        }
    }

    return {
        generate,
        update,
        tags: [TAG_MAP],
        getTheme,
        m,
        d,
    }
}

export default Map;