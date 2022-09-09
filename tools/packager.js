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
};

module.exports = {
    minify: () => {
        const originalBundle = fs.readFileSync(dest.bundle).toString().replaceAll('const ', 'let ');
        fs.writeFileSync(dest.bundle, minify(originalBundle, {
            toplevel: true,
        }).code);
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
        html += '<html><title>Infernal Throne</title>';
        html += '<link rel="shortcut icon" sizes="64x64"/>';
        html += '<style>body{overflow:hidden;background:#000;margin:0px;font-family:sans-serif;}h1{color:#fff;text-align:center;margin-top:150px;}</style>';
        html += '<h1>🔥 INFERNAL THRONE 👑<br>press any key</h1><canvas/><script>';
        html += fs.readFileSync(dest.bundle);
        html += '</script>';
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
}
