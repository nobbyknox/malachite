'use strict';

var helper = require('./helper.js');
var config = helper.getConfig();

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

    // TODO: Maybe send "403 - Unauthorised" instead of throwing an error

    if (!req.query.token && ((safePaths.indexOf(req.url) === -1) || req.url.substring(0, 6) === '/assets')) {
        next(new Error('Token not specified'));
    } else {
        next();
    }
};

app.use(endpointLogger);
app.use(tokenPolice);


// -----------------------------------------------------------------------------
// The API
// -----------------------------------------------------------------------------

app.get('/config', function(req, res) {
    res.status(200).send(JSON.stringify(config.webOptions));
});

app.post('/authenticate', function(req, res) {

    if (!req.body) {
        res.status(401).send(new Error('No credentials supplied'));
    } else {

        dataStore.get(models.UserModel, {'email': req.body.username}, {}, function(err, userModels) {
            if (err) {
                res.status(401).send(err);
            } else {

                if (!userModels || userModels.length === 0) {
                    res.status(401).send('Invalid username or password');
                } else {
                    if (userModels[0].password === req.body.password) {
                        res.status(200).send(JSON.stringify({'id': userModels[0].id, 'token': guid()}));
                    } else {
                        res.status(401).send('Invalid username or password');
                    }
                }
            }
        });

    }
});

app.get('/bookmarks/:id', function(req, res) {

    dataStore.get(models.BookmarkModel, {'id': req.params.id}, {}, function(err, bookmarks) {
        res.status(200).send(JSON.stringify(bookmarks[0]));
    });

});

app.post('/bookmarks', function(req, res) {

    dataStore.create(models.BookmarkModel, req.body, function(err) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).end();
        }
    });

});

app.put('/bookmarks', function(req, res) {

    dataStore.update(models.BookmarkModel, { 'id': req.body.id }, {}, req.body, function(err) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).end();
        }
    });

});

app.get('/bookmarks/group/:groupId', function(req, res) {

    dataStore.getWithDependents(models.GroupModel, {'id': req.params.groupId}, ['bookmarks'], function(err, groups) {
        res.status(200).send(JSON.stringify(groups[0].bookmarks));
    });

});

app.get('/groups', function(req, res) {

    dataStore.get(models.GroupModel, {'userId': 2}, {}, function(err, groups) {
        res.status(200).send(JSON.stringify(groups));
    });

});

app.get('/groups/:id', function(req, res) {

    dataStore.get(models.GroupModel, {'id': req.params.id}, {}, function(err, groups) {
        log.info(groups);
        res.status(200).send(JSON.stringify(groups));
    });

});

// -----------------------------------------------------------------------------
// The last bit
// -----------------------------------------------------------------------------

app.listen(config.port, function() {
    log.info('Server running on port %d', config.port);
});


// -----------------------------------------------------------------------------
// Private functions
// -----------------------------------------------------------------------------

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}
