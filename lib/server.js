'use strict';

var helper = require('./helper.js');
var config = helper.getConfig();
var constants = require('./constants.js');

var authService = require('./services/authentication-service.js');
var bookmarkService = require('./services/bookmark-service.js');

var express = require('express');
var bodyParser = require('body-parser');

var log = require('bunyan').createLogger(config.loggerOptions);

var app = express();

var dataStore = require('./dao/data-store.js');
var models = require('./dao/models.js');

app.use(express.static('./web'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


// -----------------------------------------------------------------------------
// Middleware functions
// -----------------------------------------------------------------------------

var endpointLogger = function(req, res, next) {
    log.debug('%s %s', req.method, req.url);

    if (req.method === 'POST' || req.method === 'PUT') {
        log.debug('%j', req.body);
    }

    next();
};

var tokenPolice = function(req, res, next) {

    var safePaths = ['/config', '/authenticate'];

    if ((safePaths.indexOf(req.url) > -1) || (req.url.substring(0, 6) === '/assets')) {
        next();
    } else {

        if (!req.query.token) {
            log.warn('Token not specified');
            res.status(constants.HTTP_UNAUTHORIZED).end('Token not specified');
        } else {
            authService.getUserIdFromToken(req.query.token, function(err, userId) {
                if (err) {
                    log.warn('Invalid token %s', req.query.token);
                    res.status(constants.HTTP_UNAUTHORIZED).end('Invalid token');
                } else {
                    req.query.__userId = userId;
                    next();
                }
            });
        }
    }
};

app.use(endpointLogger);
app.use(tokenPolice);


// -----------------------------------------------------------------------------
// The API
// -----------------------------------------------------------------------------

app.get('/config', function(req, res) {
    res.status(constants.HTTP_OKAY).send(JSON.stringify(config.webOptions));
});

app.post('/authenticate', function(req, res) {

    if (!req.body) {
        res.status(constants.HTTP_UNAUTHORIZED).send(new Error('No credentials supplied'));
    } else {

        authService.authenticateUser(req.body.username, req.body.password, function(err, authResp) {
            if (err) {
                log.error(err);
                res.status(constants.HTTP_UNAUTHORIZED).send(err);
            } else {
                res.status(constants.HTTP_OKAY).send(JSON.stringify(authResp));
            }
        });

    }
});

app.get('/bookmarks', function(req, res) {

    dataStore.get(models.BookmarkModel, {'userId': req.query.__userId}, {}, function(err, bookmarks) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            if (bookmarks.length === 0) {
                res.status(constants.HTTP_FILE_NOT_FOUND).send('');
            } else {
                res.status(constants.HTTP_OKAY).send(JSON.stringify(bookmarks));
            }
        }
    });

});

app.get('/bookmarks/:id', function(req, res) {

    dataStore.getWithDependents(models.BookmarkModel, { 'id': req.params.id, 'userId': req.query.__userId}, ['groups', 'tags'], function(err, bookmarks) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            if (bookmarks.length === 0) {
                res.status(constants.HTTP_FILE_NOT_FOUND).send('');
            } else {
                res.status(constants.HTTP_OKAY).send(JSON.stringify(bookmarks[0] || null));
            }
        }
    });

});

app.post('/bookmarks', function(req, res) {

    var bookmarkWrapper = req.body;
    bookmarkWrapper.model.userId = req.query.__userId;

    bookmarkService.saveBookmark(bookmarkWrapper, function(err, data) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });

});

app.put('/bookmarks', function(req, res) {

    bookmarkService.saveBookmark(req.body, function(err, data) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });

});

app.delete('/bookmarks/:id', function(req, res) {
    dataStore.remove(models.BookmarkModel, {'id': req.params.id, 'userId': req.query.__userId}, {}, true, function(err) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });
});

app.get('/bookmarks/group/:id', function(req, res) {

    dataStore.getWithDependents(models.GroupModel, { 'id': req.params.id, 'userId': req.query.__userId}, ['bookmarks'], function(err, groups) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).send(JSON.stringify(groups[0].bookmarks));
        }
    });

});

app.get('/bookmarks/tag/:id', function(req, res) {

    dataStore.getWithDependents(models.TagModel, { 'id': req.params.id, 'userId': req.query.__userId}, ['bookmarks'], function(err, groups) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).send(JSON.stringify(groups[0].bookmarks));
        }
    });

});

// ------
// Groups
// ------
app.get('/groups', function(req, res) {

    var options = {
        where: {
            userId: req.query.__userId
        }
    };

    if (req.query.search) {
        options.like = [{"column": 'name', "value": req.query.search}];
        options.limit = 10;
    }

    dataStore.superGet(models.GroupModel, options, function(err, groups) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).send(JSON.stringify(groups));
        }
    });

});

app.get('/groups/:id', function(req, res) {

    var options = {
        where: {
            'id': req.params.id,
            'userId': req.query.__userId
        }
    };

    dataStore.superGet(models.GroupModel, options, function(err, groups) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            if (groups.length === 0) {
                res.status(constants.HTTP_FILE_NOT_FOUND).send('');
            } else {
                res.status(constants.HTTP_OKAY).send(JSON.stringify(groups[0]));
            }
        }
    });

});

app.post('/groups', function(req, res) {

    dataStore.create(models.GroupModel, req.body, function(err) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });

});

app.put('/groups', function(req, res) {

    dataStore.update(models.GroupModel, {'id': req.body.id}, {}, req.body, function(err) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });

});

// TODO: Delete group

// ----
// Tags
// ----
app.get('/tags', function(req, res) {

    var options = {
        where: {
            userId: req.query.__userId
        }
    };

    if (req.query.search) {
        options.like = [{"column": 'name', "value": req.query.search}];
        options.limit = 10;
    }

    dataStore.superGet(models.TagModel, options, function(err, groups) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).send(JSON.stringify(groups));
        }
    });

});

app.get('/tags/:id', function(req, res) {

    var options = {
        where: {
            'id': req.params.id,
            'userId': req.query.__userId
        }
    };

    dataStore.superGet(models.TagModel, options, function(err, groups) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            if (groups.length === 0) {
                res.status(constants.HTTP_FILE_NOT_FOUND).send('');
            } else {
                res.status(constants.HTTP_OKAY).send(JSON.stringify(groups[0]));
            }
        }
    });

});

app.post('/tags', function(req, res) {

    var tagModel = req.body;
    tagModel.userId = req.query.__userId;

    dataStore.create(models.TagModel, tagModel, function(err) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });

});

app.put('/tags', function(req, res) {

    // TODO: Include user id in where clause
    dataStore.update(models.TagModel, {'id': req.body.id}, {}, req.body, function(err) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });

});

// TODO: Delete tag

// -----------------------------------------------------------------------------
// The last bit
// -----------------------------------------------------------------------------

app.listen(config.port, function() {
    log.info('Server running on port %d', config.port);
});
