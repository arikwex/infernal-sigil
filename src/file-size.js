const fs = require('fs');
const path = require('path');

const buffer = fs.readFileSync(path.resolve('./dist/build.zip'));
console.log(`===> Build Size: ${buffer.length} / 13,312 bytes <===`);