const fs = require('fs');

module.exports = {
    buildMap: (path) => {
        const data = fs.readFileSync(path);
        return data;
    }
};