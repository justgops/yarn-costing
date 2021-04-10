const path = require('path');
const migrate = require(path.resolve(__dirname, 'db', 'migrate.js'));
const server = require(path.resolve(__dirname, 'server.js'));
migrate.run();
server();