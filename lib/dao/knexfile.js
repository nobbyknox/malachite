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
            filename: './data/development.sqlite3'
        },
        pool: {
            max: 1
        }
    },

    production: {
        client: 'sqlite3',
        connection: {
            filename: './data/production.sqlite3'
        },
        pool: {
            max: 1
        }
    }

};
