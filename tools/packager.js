const fs = require('fs');
const path = require('path');
const zip = require('bestzip');
const { Packer } = require('roadroller');

const dest = {
    bundle: path.resolve('./dist/build.js'),
    html: path.resolve('./index.html'),
    zip: path.resolve('./dist/build.zip'),
};

module.exports = {
    optimize: async () => {
        const inputs = [{
            data: fs.readFileSync(dest.bundle).toString(),
            type: 'js',
            action: 'eval',
        }];
        const packer = new Packer(inputs, { optimize: 2 });
        await packer.optimize();
        const { firstLine, secondLine } = packer.makeDecoder();
        fs.writeFileSync(dest.bundle, firstLine + secondLine);
    },

    html: () => {
        var html = '';
        html += '<html><title>INFERNAL SIGIL</title>';
        html += '<link rel="shortcut icon" type="image/x-icon" href="images/favicon.ico" sizes="64x64"/>';
        html += '<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=0\">';
        html += '<style>canvas{margin:0 auto;border:1px solid #222;}body{background:#000;flex-direction:row;display:flex;padding:30px;}</style>';
        html += '<canvas><script>';
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
        console.log(`===> Build Size: ${buffer.length} / 13,312 bytes <===`);
    },
}
