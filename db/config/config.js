const path = require('path');
const os = require('os');
const fs = require('fs');

let basePath = '';

if(os.platform() === 'win32') {
    basePath = path.join(os.homedir(), 'AppData', 'Local', 'DailyAttendance');
} else {
    basePath = path.join(os.homedir(), '.DailyAttendance');
}

!fs.existsSync(basePath) && fs.mkdirSync(basePath);
const configDbPath = path.resolve(basePath, 'daily-attendance.mdf');

module.exports = {
    "dialect": "sqlite",
    "storage": configDbPath,
    "define": {
        freezeTableName: true,
    }
}