const path = require('path');
const os = require('os');
const fs = require('fs');

const packageJson = require(path.resolve(__dirname, '..', '..','package.json'));

let basePath = '';

if(os.platform() === 'win32') {
    basePath = path.join(os.homedir(), 'AppData', 'Local', packageJson.productName);
} else {
    basePath = path.join(os.homedir(), '.' + packageJson.productName);
}


!fs.existsSync(basePath) && fs.mkdirSync(basePath);
const configDbPath = path.resolve(basePath, 'storage.mdf');

module.exports = {
    "dialect": "sqlite",
    "storage": configDbPath,
    "define": {
        freezeTableName: true,
    }
}