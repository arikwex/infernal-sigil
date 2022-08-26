import gamemap from './game-map.png';
import { canvas } from './canvas';
import { add, getObjectsByTag } from './engine';
import { BoundingBox } from './bbox';
import Player from './player';
import Camera from './camera';
import Skeleton from './skeleton';
import Wall from './wall';

function Map() {
    let img = new Image();
    let data = null;
    let W, H;

    async function generate() {
        await new Promise((r) => {
            img.onload = r;
            img.src = gamemap;
        });

        //
        let context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        W = img.width;
        H = img.height;
        data = context.getImageData(0, 0, W, H).data;
        context.clearRect(0, 0, W, H);
        
        const BLOCK_SIZE = 100;

        // Character placements
        for (let x = 0; x < W; x++) {
            for (let y = 0; y < H; y++) {
                const V = get(x, y);
                if (V == 0x00ff00) {
                    add(new Player(x * BLOCK_SIZE, y * BLOCK_SIZE));
                    add(new Camera(x * BLOCK_SIZE, y * BLOCK_SIZE));
                }
                if (V == 0xff0000) {
                    add(new Skeleton(x * BLOCK_SIZE, y * BLOCK_SIZE));
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
        console.log(vertMap);

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
                    //add({ tags: ['physics'], physics: new BoundingBox((x - 0.5) * BLOCK_SIZE, (y - 0.5) * BLOCK_SIZE, 0, 0, (q - x) * BLOCK_SIZE, (vm[1] - y) * BLOCK_SIZE) });
                    add(new Wall((x - 0.5) * BLOCK_SIZE, (y - 0.5) * BLOCK_SIZE, (q - x) * BLOCK_SIZE, (vm[1] - y) * BLOCK_SIZE));
                }
            }
        }
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