const fs = require('fs');
const { PNG } = require("pngjs");

function ENTITY(V) {
    const wallType = ({
        [0x000000]: 'Empty',
        [0xffffff]: 'The Styx',
        [0x64ff64]: 'Asphodel Meadows',
        [0xff80ff]: 'Elysian Boneyard',
        [0xff800a]: 'Fields of Mourning',
        [0xc8c800]: 'Throne Room',
    })[V];
    if (wallType) return wallType;

    if (V == 0x00ff00) return 'Player';
    if (V == 0x7f7f7f) return 'Reserve';

    const D0 = (V >> 16) & 0xff;
    const D1 = (V >> 8) & 0xff;
    const D2 = V & 0xff;
    if (D2 == 0xff) {
        if (D0 == 0x00) { return `Treasure ${({ 1: 'Bronze', 2: 'Silver', 3: 'Gold' })[D1]}`; }
        if (D0 == 0x01) { return `Switch ${D1}`; }
        if (D0 == 0x02) { return `Switch ${D1}`; }
        if (D0 == 0x03) { return `Gate ${D1}`; }
        if (D0 == 0x04) { return `Shrine ${D1}`; }
        if (D0 == 0x05) { return 'Web'; }
        if (D0 == 0x06) { return `Checkpoint ${D1}`; }
    }

    if (D0 == 0xff) {
        if (D1 == 0x00) { return 'Skeleton'; }
        if (D1 == 0x01) { return 'Hazard'; }
        if (D1 == 0x02) { return 'Spider'; }
    }

    return undefined;
};

function SERIALIZE(V) {
    const wallType = ({
        [0x000000]: 'Empty',
        [0xffffff]: 'The Styx',
        [0x64ff64]: 'Asphodel Meadows',
        [0xff80ff]: 'Elysian Boneyard',
        [0xff800a]: 'Fields of Mourning',
        [0xc8c800]: 'Throne Room',
    })[V];
    if (wallType) return [0, 0];

    if (V == 0x00ff00) return ['Player', 0];
    if (V == 0x7f7f7f) return [0, 0];

    const D0 = (V >> 16) & 0xff;
    const D1 = (V >> 8) & 0xff;
    const D2 = V & 0xff;
    if (D2 == 0xff) {
        if (D0 == 0x00) { return ['Treasure', D1]; }
        if (D0 == 0x01) { return ['Switch', D1]; }
        if (D0 == 0x02) { return ['Switch2', D1]; }
        if (D0 == 0x03) { return ['Gate', D1]; }
        if (D0 == 0x04) { return ['Shrine', D1]; }
        if (D0 == 0x05) { return ['Web', 0]; }
        if (D0 == 0x06) { return ['Checkpoint', D1]; }
    }

    if (D0 == 0xff) {
        if (D1 == 0x00) { return ['Skeleton', D2]; }
        if (D1 == 0x01) { return ['Hazard', D2]; }
        if (D1 == 0x02) { return ['Spider', D2]; }
    }

    return undefined;
};

function checkErrors(humanNameCount) {
    const nameCount = {};
    for (const value of Object.values(humanNameCount)) {
        nameCount[value[0]] = value[1];
    }
    for (const value of Object.values(humanNameCount)) {
        // console.log(value);
        const name = value[0];
        const count = value[1];
        const type = name.split(' ')[0];
        const data = name.split(' ')[1];

        if (type == 'Switch') {
            if (count > 1) { console.error(`### Duplicated ${name} is not allowed! ###`); }
            if (!nameCount[`Gate ${data}`]) { console.error(`### Missing Gate for ${name}! ###`); }
        }
        if (type == 'Gate') {
            if (!nameCount[`Switch ${data}`]) { console.error(`### Missing Switch for ${name}! ###`); }
        }
    }
}

function printStats(humanNameCount) {
    const nameCount = {};
    const aggCount = {};
    for (const value of Object.values(humanNameCount)) {
        nameCount[value[0]] = value[1];
        const aggKey = value[0].split(' ')[0];
        aggCount[aggKey] = (aggCount[aggKey] || 0) + value[1];
    }
    console.log(`# Bronze Treasures: ${nameCount['Treasure Bronze']}`);
    console.log(`# Silver Treasures: ${nameCount['Treasure Silver']}`);
    console.log(`# Gold Treasures: ${nameCount['Treasure Gold']}`);
    console.log(`# Switches: ${aggCount['Switch']}`);
    console.log(`# Shrines: ${aggCount['Shrine']}`);
    console.log(`# Checkpoints: ${aggCount['Checkpoint']}`);
}

function compileMapReader(uniqueEntries) {
    let code = ```
    import Player from './player';
    import Skeleton from './skeleton';
    import Spider from './spider';
    import Treasure from './treasure';
    import Hazard from './hazard';
    import Gate from './gate';
    import Switch from './switch';
    import Shrine from './shrine';
    import Web from './web';
    import Checkpoint from './checkpoint';
    export default [
    ```;
    const keys = Object.keys(uniqueEntries).sort((a, b) => uniqueEntries[a] - uniqueEntries[b]);
    console.log(keys, keys.map((k) => uniqueEntries[k]));
    for (let i = 0; i < keys.length; i++) {
        const serial = SERIALIZE(keys[i]);
        code += '  ' + serial[0] + ',' + serial[1] + ',\n';
    }
    code += '];';

    console.log(code);
    // fs.writeFileSync('./src/GENERATED-map-lookup.js', code);
}

module.exports = {
    buildMap: (path) => {
        const elements = [];
        let originalMapData = fs.readFileSync(path);

        let entryId = 0;
        let uniqueEntries = {};
        let humanNameCount = {};

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
                
                if (uniqueEntries[v] == undefined) {
                    uniqueEntries[v] = entryId++;
                }
                if (!humanNameCount[v]) {
                    humanNameCount[v] = [ENTITY(v), 0];
                }
                humanNameCount[v][1] += 1;

                // DEBUG
                // if (ENTITY(v) == 'Switch 6') {
                //     console.log(x + ', ' + y);
                // }

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

        checkErrors(humanNameCount);
        printStats(humanNameCount);
        compileMapReader(uniqueEntries);
        console.log(`** Map unique entries = ${Object.keys(uniqueEntries).length} **`);

        // Remap to grayscale
        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                const idxBase = (png.width * y + x)
                const idx = idxBase << 2;
                const v = (data[idx] << 16) | (data[idx + 1] << 8) | data[idx + 2];
                const gray = uniqueEntries[v];
                data[idx] = gray;
                data[idx + 1] = gray;
                data[idx + 2] = gray;
                data[idx + 3] = 255;
            }
        }

        // const u8 = new Uint8Array(elements);
        // var decoder = new TextDecoder('utf8');
        // var b64encoded = btoa(decoder.decode(u8));

        // Pack it back into a PNG data
        let buff = PNG.sync.write(png, {
            filterType: 0,
            colorType: 0,
            bitDepth: 8,
            bgColor: { red: 0, green: 0, blue: 0 },
        });

        // Write a PNG file
        fs.writeFileSync('./dist/processed-map.png', buff);
        return buff;
    }
};