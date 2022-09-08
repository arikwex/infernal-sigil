const fs = require('fs');
const path = require('path');
const zip = require('bestzip');
const chalk = require('chalk');
const { minify } = require('uglify-js');
const { Packer } = require('roadroller');

const dest = {
    bundle: path.resolve('./dist/build.js'),
    html: path.resolve('./index.html'),
    zip: path.resolve('./dist/build.zip'),
    map: path.resolve('./dist/processed-map.png'),
};

module.exports = {
    minify: () => {
        const originalBundle = fs.readFileSync(dest.bundle).toString();
        fs.writeFileSync(dest.bundle, minify(originalBundle).code);
    },

    optimize: async () => {
        const inputs = [{
            data: fs.readFileSync(dest.bundle).toString(),
            type: 'js',
            action: 'eval',
        }];
        const packer = new Packer(inputs, {});
        await packer.optimize(2, async (info) => {
            await new Promise(resolve => setImmediate(resolve))
            console.warn(`${info.pass} => ${(info.passRatio * 100).toFixed(1)}%`);
        });
        const { firstLine, secondLine } = packer.makeDecoder();
        fs.writeFileSync(dest.bundle, firstLine + secondLine);
    },

    html: () => {
        var html = '';
        html += '<html><title>INFERNAL SIGIL</title>';
        html += '<link rel="shortcut icon" type="image/x-icon" href="images/favicon.ico" sizes="64x64"/>';
        html += '<style>canvas{width:100%;}body{overflow:none;background:#000;margin:0px;}</style>';
        html += '<canvas/><script>';
        html += fs.readFileSync(dest.bundle);
        html += '</script></html>';
        fs.writeFileSync(dest.html, html);
    },

    zip: async () => {
        await zip({
            source: dest.html,
            destination: dest.zip
        });
    },

    stats: () => {
        const buffer = fs.readFileSync(dest.zip);
        const strFormat = buffer.length.toLocaleString('en-US');
        let color;
        if (buffer.length <= 13312) {
            color = chalk.green;
        } else {
            color = chalk.yellow;
        }
        console.log(`===> Build Size: ${color(strFormat + '/ 13,312 bytes')} <===`);
    },

    mapInjector: () => {
        const mapBuffer = fs.readFileSync(dest.map);
        const buildBuffer = fs.readFileSync(dest.bundle);

        console.log(mapBuffer);

        // Write first half of buffer
        const outputBuffer = [];
        let i = 0;
        while (true) {
            const byte = buildBuffer[i];
            const byte2 = buildBuffer[i + 1];
            const byte3 = buildBuffer[i + 2];
            // Look for injection site
            if (byte == 60 && byte2 == 60 && byte3 == 60) {
                i += 3;
                break;
            }
            outputBuffer.push(byte);
            i += 1;
        }
        
        // Inject map
        for (let j = 0; j < mapBuffer.length; j++) {
            if (mapBuffer[j] == 39) {
                // \'
                outputBuffer.push(92);
                outputBuffer.push(39);
            } else if (mapBuffer[j] == 34) {
                // \"
                outputBuffer.push(92);
                outputBuffer.push(34);
            } else if (mapBuffer[j] == 10) {
                // \n
                outputBuffer.push(92);
                outputBuffer.push(110);
            } else if (mapBuffer[j] == 13) {
                // \r
                outputBuffer.push(92);
                outputBuffer.push(114);
            } else if (mapBuffer[j] == 8) {
                // \b
                outputBuffer.push(92);
                outputBuffer.push(98);
            } else if (mapBuffer[j] == 12) {
                // \f
                outputBuffer.push(92);
                outputBuffer.push(102);
            } else if (mapBuffer[j] == 9) {
                // \t
                outputBuffer.push(92);
                outputBuffer.push(116);
            } else if (mapBuffer[j] == 11) {
                // \v
                outputBuffer.push(92);
                outputBuffer.push(118);
            } else if (mapBuffer[j] == 92) {
                // \\
                outputBuffer.push(92);
                outputBuffer.push(92);
            } else if (mapBuffer[j] >= 1128) {
                // \xff
                outputBuffer.push(92);
                outputBuffer.push(120);
                const str = (mapBuffer[j]).toString(16);
                outputBuffer.push(str.charCodeAt(0));
                outputBuffer.push(str.charCodeAt(1));
            } else {
                outputBuffer.push(mapBuffer[j]);
            }
        }

        // Rest of build file
        while (i < buildBuffer.length) {
            const byte = buildBuffer[i];
            outputBuffer.push(byte);
            i += 1;
        }

        const writeBuffer = Buffer.from(new Uint8Array(outputBuffer));
        console.log(writeBuffer);
        fs.writeFileSync(dest.bundle, writeBuffer);
    }
}
