const fs = require('fs');
const { PNG } = require("pngjs");

module.exports = {
    buildMap: (path) => {
        const elements = [];
        let originalMapData = fs.readFileSync(path);
        let uniqueEntries = {};

        // Parse it
        let png = PNG.sync.read(originalMapData, {
            filterType: 0,
            colorType: 0,
            bitDepth: 8,
            bgColor: { red: 0, green: 0, blue: 0 },
            deflateChunkSize: 256
        });

        // Process walls
        const data = png.data;
        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                const idxBase = (png.width * y + x)
                const idx = idxBase << 2;
                const v = (data[idx] << 16) | (data[idx + 1] << 8) | data[idx + 2];
                uniqueEntries[v] = true;
                if (v == 0x000000) {
                    continue;
                }
                else if (v != 0xffffff) {
                    // elements.push(x, y, parseInt(Math.random() * 30), parseInt(Math.random() * 30));
                    // data[idx] = 0;
                    // data[idx + 1] = 0;
                    // data[idx + 2] = 0;
                    // data[idx + 3] = 0;
                }
            }
        }
        console.log(`** Map unique entries = ${Object.keys(uniqueEntries).length} **`);
        // const u8 = new Uint8Array(elements);
        // var decoder = new TextDecoder('utf8');
        // var b64encoded = btoa(decoder.decode(u8));

        // Pack it back into a PNG data
        let buff = PNG.sync.write(png, {
            // filterType: 0,
            // colorType: 0,
            // bitDepth: 8,
            // bgColor: { red: 0, green: 0, blue: 0 },
        });

        // Write a PNG file
        fs.writeFileSync('./dist/processed-map.png', buff);
        return buff;
    }
};