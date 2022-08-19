const path = require('path');
const esbuild = require('esbuild');
const { optimize, html, zip, stats } = require('./packager');

const entry = path.resolve('./src/main.js');
const watch = process.argv.includes('--watch');
const minify = process.argv.includes('--minify');
const roadroll = process.argv.includes('--roadroll');

let postBuildPlugin = {
    name: 'Post-Build',
    setup(build) {
        build.onEnd(async() => {
            if (roadroll) {
                await optimize();
            }
            html();
            await zip();
            stats();
        })
    },
}

const buildProcess = esbuild.build({
    entryPoints: [entry],
    outfile: './dist/build.js',
    bundle: true,
    watch,
    minify,
    plugins: [postBuildPlugin],
});
