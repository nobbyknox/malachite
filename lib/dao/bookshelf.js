'use strict';

var knexConfig = require('./knexfile.js');
var knex = require('knex')(knexConfig[(process.env.MALACHITE_ENV || 'development')]);
var bookshelf = require('bookshelf')(knex);

/*
 * For the unittest environment we perform a schema migration + loading
 * of the seed data. Each unit test can create additional data if it
 * wishes. However, the seed data should not be molested with too much
 * as most unit tests will rely on it.
 */
// if (enviroConfig.getEnvironment() === 'unittest') {
//     global.unittestDataSeeded = false;
//     knex.migrate.latest().then(function() {
//         knex.seed.run().then(function() {
//             global.unittestDataSeeded = true;
//         });
//     });
// }

module.exports = bookshelf;
