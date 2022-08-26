import gamemap from './game-map.png';
import { canvas } from './canvas';
import { add, getObjectsByTag } from './engine';
import { BoundingBox } from './bbox';

function Map() {
    let img = new Image();
    let data = null;
    let W;

    async function generate() {
        await new Promise((r) => {
            img.onload = r;
            img.src = gamemap;
        });

        //
        let context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        W = img.width;
        const H = img.height;
        data = context.getImageData(0, 0, W, H).data;
        console.log(data);
        context.clearRect(0, 0, W, H);
        
        const BLOCK_SIZE = 100;

        // Character placements
        for (let x = 0; x < W; x++) {
            for (let y = 0; y < H; y++) {
                const baseIdx = (x + y * W) << 2;
                const V = get(x, y);
                // if (V == 0xffffff) {
                //     //add({ tags: ['physics'], physics: new BoundingBox((x - 0.5) * BLOCK_SIZE, (y - 0.5) * BLOCK_SIZE, 0, 0, BLOCK_SIZE, BLOCK_SIZE) });
                // }
                if (V == 0x00ff00) {
                    getObjectsByTag('player')[0].move(x * BLOCK_SIZE, y * BLOCK_SIZE);
                }
            }
        }

        // Merge walls vertically
        const usedMap = {};
        for (let x = 0; x < W; x++) {
            for (let y = 0; y < H; y++) {
                const V = get(x, y);
                if (V == 0xffffff && !usedMap[x+','+y]) {
                    let q = y;
                    while (q < 128) {
                        const V2 = get(x, q);
                        if (V2 != 0xffffff) {
                            break;
                        }
                        usedMap[x+','+q] = true;
                        q++;
                    }
                    add({ tags: ['physics'], physics: new BoundingBox((x - 0.5) * BLOCK_SIZE, (y - 0.5) * BLOCK_SIZE, 0, 0, BLOCK_SIZE, (q - y) * BLOCK_SIZE) });
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