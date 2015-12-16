'use strict';

let config = require('../../config/' + (process.env.MALACHITE_ENV || 'development') + '.json');
let helper = require('../helper.js');
let log = require('bunyan').createLogger(config.loggerOptions);

let knexConfig = require('./knexfile.js');
let knex = require('knex')(knexConfig[(process.env.MALACHITE_ENV || 'development')]);

function create(model, data, next) {

    model
        .forge(data)
        .save()
        .then(function(model) {
            log.trace(model.toJSON());
            next(null, model.toJSON());
        }, function(err) {
            log.error(err);
            next(err);
        })
        .catch(function(err) {
            log.error(err);
            next(err);
        });
}

// This function is now obsolete. Please use "superGet".
function get(model, where, whereNot, next) {

    let query = {
        where: {},
        whereNot: {}
    };

    query.where = where;
    query.whereNot = whereNot;

    log.trace('Criteria: %j', query);

    model
        .query(query)
        .fetchAll()
        .then(function(model) {
            log.trace(model.toJSON());
            next(null, model.toJSON());
        }, function(err) {
            log.error(err);
            next(err);
        })
        .catch(function(err) {
            log.error(err);
            next(err);
        });
}

function getWithDependents(model, where, dependentArray, next) {

    let query = {
        where: {},
        whereNot: {}
    };

    query.where = where;

    log.trace('Criteria: %j', query);

    model
        .query(query)
        .fetchAll({withRelated: dependentArray, require: true})
        .then(function(model) {
            log.trace(model.toJSON());
            next(null, model.toJSON());
        }, function(err) {
            log.error(err);
            next(err);
        })
        .catch(function(err) {
            log.error(err);
            next(err);
        });
}

function raw(query, next) {

    log.trace('Raw query: %s', query);

    knex.raw(query).then(function(resp) {
        log.trace(resp);
        next(null, resp);
    });
}

function remove(model, where, whereNot, destroy, next) {

    if (destroy) {
        let query = {
            where: {},
            whereNot: {},
            del: {}
        };

        query.where = where;
        query.whereNot = whereNot;

        model
            .query(query)
            .fetch()
            .then(function() {
                next();
            }, function(err) {
                log.error(err);
                next(err);
            })
            .catch(function(err) {
                log.error(err);
                next(err);
            });
    } else {
        let data = {
            dateRemoved: helper.currentDatestamp()
        };

        update(model, where, whereNot, data, options, next);
    }
}

/**
 * The superman of gets.
 *
 * Options model:
 *     let options = {
 *            'where': { 'userId': req.query.__userId },
 *            'related': ['tags'],
 *            'join': {
 *                'tableName': 'bookmarks_meta',
 *                'on': ['bookmarks.id', '=', 'bookmarks_meta.bookmarkId'],
 *                'andOn': [
 *                    ['bookmarks_meta.attr', '=', 'key1'],
 *                    ['bookmarks_meta.value', '=', 'value15']]
 *            },
 *            'orderBy': [['dateCreated', 'desc']],
 *            'limit': 10
 *        };
 *
 * @param model
 * @param options
 * @param next
 */
function superGet(model, options, next) {

    log.trace('Options: %j', options);

    let withRelated;

    if (options.related) {
        withRelated = {
            withRelated: options.related,
            require: false
        };
    }

    model
        .query(function(db) {

            db.where(options.where);

            if (options.orWhere) {
                db.orWhere(options.orWhere);
            }

            if (options.like && options.like.length > 0) {
                options.like.forEach(function(item) {
                    db.andWhere(item.column, 'like', '%' + item.value + '%')
                });
            }

            if (options.join) {
                db.join(options.join.tableName, function() {
                    let joinThing = this;

                    this
                        .on(options.join.on[0], options.join.on[1], options.join.on[2]);

                    if (options.join.andOn && options.join.andOn.length > 0) {
                        options.join.andOn.forEach(function(item) {
                            joinThing.andOn(item[0], item[1], item[2]);
                        });
                    }
                });
            }

            if (options.orderBy && options.orderBy.length > 0) {
                options.orderBy.forEach(function(orderByItem) {
                    db.orderBy(orderByItem[0], (orderByItem.length > 0 ? orderByItem[1] : undefined));
                });
            }

            if (options.limit) {
                db.limit(options.limit);
            }
        })
        .fetchAll(withRelated)
        .then(function(model) {
            log.trace(model.toJSON());
            next(null, model.toJSON());
        }, function(err) {
            log.error(err);
            next(err);
        })
        .catch(function(err) {
            log.error(err);
            next(err);
        });
}

function update(model, where, whereNot, data, next) {

    let query = {
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
        .then(function(model) {
            log.trace(model.toJSON());
            next(null, model.toJSON());
        }, function(err) {
            log.error(err);
            next(err);
        })
        .catch(function(err) {
            log.error(err);
            next(err);
        });
}


// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    create: create,
    get: get,
    getWithDependents: getWithDependents,
    raw: raw,
    remove: remove,
    superGet: superGet,
    update: update
};
