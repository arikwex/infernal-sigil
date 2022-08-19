const fs = require('fs');
const path = require('path');

var html = '';
html += '<html><title>INFERNAL SIGIL</title>';
html += '<link rel="shortcut icon" type="image/x-icon" href="images/favicon.ico" sizes="64x64"/>';
html += '<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=0\">';
html += '<style>canvas{width:100%;height:100%;}body{margin:0;background:#000;}</style>';
html += '<canvas><script>';
html += fs.readFileSync(path.resolve('./dist/bundle.min.js'));
html += '</script></html>';

fs.writeFileSync(path.resolve('./index.html'), html);