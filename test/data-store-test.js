'use strict';

var config = require('../config/' + (process.env.MALACHITE_ENV || 'development') + '.json');

var assert = require('assert');
var path = require('path');

var dataStore = require('../lib/dao/data-store.js');
var models = require('../lib/dao/models.js');
var bookshelf = require('../lib/dao/bookshelf.js');

var Q = require('q');
var moment = require('moment');
var log = require('bunyan').createLogger(config.loggerOptions);

describe(path.basename(__filename), function() {

    before(function (done) {
        // var timer = setInterval(function() {
        //     if (global.unittestDataSeeded) {
        //         clearInterval(timer);
        //         done();
        //     }
        // }, 50);

        setTimeout(function() {
            done();
        }, 1000);

    });

    describe('Data retrieval:', function () {

        it('should find all bookmarks', function (done) {

            var where = {};
            var whereNot = {};

            dataStore.get(models.BookmarkModel, where, whereNot, function (err, bookmarks) {
                assert(!err);
                done();
            });
        });

    });

    describe('Data insertion:', function () {

        it('should insert a new model', function (done) {

            var model = {
                title: 'Test 01',
                address: 'http://localhost:3003/',
                dateAdded: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                userId: 2
            };

            dataStore.create(models.BookmarkModel, model, function (err, newId) {
                assert(!err);
                done();
            });

        });
    });
});
