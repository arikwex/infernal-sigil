const fs = require('fs');
const path = require('path');

var html = '';
html += '<html><title>INFERNAL SIGIL</title>';
html += '<link rel="shortcut icon" type="image/x-icon" href="images/favicon.ico" sizes="64x64"/>';
html += '<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=0\">';
html += '<style>canvas{margin:0 auto;border:1px solid #222;}body{background:#000;flex-direction:row;display:flex;padding:30px;}</style>';
html += '<canvas><script>';
html += fs.readFileSync(path.resolve('./dist/bundle.min.js'));
html += '</script></html>';

fs.writeFileSync(path.resolve('./index.html'), html);