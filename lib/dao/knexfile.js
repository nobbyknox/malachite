'use strict';

module.exports = {

    unittest: {
        client: 'sqlite3',
        connection: {
            filename: ':memory:'
        },
        pool: {
            max: 1
        }
    },

    development: {
        client: 'sqlite3',
        connection: {
            filename: './db/development.sqlite3'
        },
        pool: {
            max: 1
        }
    },

    production: {
        client: 'sqlite3',
        connection: {
            filename: './db/production.sqlite3'
        },
        pool: {
            max: 1
        }
    }

};
