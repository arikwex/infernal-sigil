const path = require('path');
const esbuild = require('esbuild');
const { minify, optimize, html, zip, stats } = require('./packager');

const entry = path.resolve('./src/main.js');
const useWatch = process.argv.includes('--watch');
const useMinify = process.argv.includes('--minify');
const useRoadroller = process.argv.includes('--roadroll');

let postBuildPlugin = {
    name: 'Post-Build',
    setup(build) {
        build.onEnd(async() => {
            if (useMinify) {
                minify();
            }
            if (useRoadroller) {
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
    watch: useWatch,
    plugins: [postBuildPlugin],
});
