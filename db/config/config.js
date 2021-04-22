const path = require('path');
const os = require('os');
const fs = require('fs');

let basePath = '';

if(os.platform() === 'win32') {
    basePath = path.join(os.homedir(), 'AppData', 'Local', 'Calculators');
} else {
    basePath = path.join(os.homedir(), '.Calculators');
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