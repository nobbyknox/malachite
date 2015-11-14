'use strict';

var config = require('../../config/' + (process.env.MALACHITE_ENV || 'development') + '.json');
var moment = require('moment');
var log = require('bunyan').createLogger(config.loggerOptions);

function get(model, where, whereNot, next) {

    var query = {
        where: {},
        whereNot: {}
    };

    query.where = where;
    query.whereNot = whereNot;

    model
    .query(query)
    .fetchAll()
    .then(function (model) {
        log.trace(model.toJSON());
        next(null, model.toJSON());
    }, function(err) {
        log.error(err);
        next(err);
    })
    .catch(function (err) {
        log.error(err);
        next(err);
    });
}

function create(model, data, next) {

    model
    .forge(data)
    .save()
    .then(function (model) {
        log.trace(model.toJSON());
        next(null, model.toJSON());
    }, function(err) {
        log.error(err);
        next(err);
    })
    .catch(function (err) {
        log.error(err);
        next(err);
    });
}

function update(model, where, whereNot, data, next) {

    var query = {
        where: {},
        whereNot: {},
        update: {}
    };

    query.where = where;
    query.whereNot = whereNot;
    query.update = data;

    model
    .query(query)
    .fetchAll()
    .then(function (model) {
        log.trace(model.toJSON());
        next(null, model.toJSON());
    }, function(err) {
        log.error(err);
        next(err);
    })
    .catch(function (err) {
        log.error(err);
        next(err);
    });
}

function remove(model, where, whereNot, destroy, next) {

    if (destroy) {
        var query = {
            where: {},
            whereNot: {},
            del: {}
        };

        query.where = where;
        query.whereNot = whereNot;

        model
        .query(query)
        .fetch()
        .then(function (model) {
            log.trace(model.toJSON());
            next(null, model.toJSON());
        }, function(err) {
            log.error(err);
            next(err);
        })
        .catch(function (err) {
            log.error(err);
            next(err);
        });
    } else {
        var data = {
            dateRemoved: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        };

        update(model, where, whereNot, data, options, next);
    }
}

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    get: get,
    create: create,
    update: update,
    remove: remove
};
