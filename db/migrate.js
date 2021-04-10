const path = require('path');
const Umzug = require('umzug');
const database = require('./models').sequelize;
const migrationsDir = path.resolve(__dirname, 'migrations');
const seedersDir = path.resolve(__dirname, 'seeders');

const migrationsConfig = new Umzug({
    storage: 'sequelize',
    storageOptions: {
        sequelize: database
    },

    // see: https://github.com/sequelize/umzug/issues/17
    migrations: {
        params: [
            database.getQueryInterface(), // queryInterface
            database.constructor, // DataTypes
            function () {
                throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.');
            }
        ],
        path: migrationsDir,
        pattern: /\.js$/
    },

    logging: function () {
        console.log.apply(null, arguments);
    }
});

const seedersConfig = new Umzug({
    storage: 'sequelize',
    storageOptions: {
        sequelize: database,
        modelName: 'SequelizeData',
    },

    // see: https://github.com/sequelize/umzug/issues/17
    migrations: {
        params: [
            database.getQueryInterface(), // queryInterface
            database.constructor, // DataTypes
            function () {
                throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.');
            }
        ],
        path: seedersDir,
        pattern: /\.js$/
    },

    logging: function () {
        console.log.apply(null, arguments);
    }
});

function logUmzugEvent(eventName) {
    return function (name, migration) {
        console.log(`${name} ${eventName}`);
    }
}
function runMigrations() {
    return migrationsConfig.up()
        .then(()=>{
            seedersConfig.up();
        });
}

['migrating', 'migrated', 'reverting', 'reverted'].forEach((event)=>{
    migrationsConfig.on(event, logUmzugEvent(event));
    seedersConfig.on(event, logUmzugEvent(event));
});

module.exports = {
    run: runMigrations
};