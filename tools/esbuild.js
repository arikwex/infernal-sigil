const path = require('path');
const esbuild = require('esbuild');
const { minify, optimize, html, zip, stats, mapInjector } = require('./packager');
const { buildMap, buildMapIndex } = require('./map-compiler');

const entry = path.resolve('./src/main.js');
const useWatch = process.argv.includes('--watch');
const useMinify = process.argv.includes('--minify');
const useRoadroller = process.argv.includes('--roadroll');

let postBuildPlugin = {
    name: 'Post-Build',
    setup(build) {
        build.onStart(() => {
            // Create GENERATED CODE that maps encoded values to instance data
            buildMapIndex('./src/game-map.png');
            // Save the map as grayscale encoding
            buildMap('./src/game-map.png');
        });

        build.onLoad({ filter: /\.png$/ }, (args) => {
            return {
                contents: buildMap(args.path),
                loader: 'text',
            }
        })

        build.onEnd(async() => {
            mapInjector();
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
