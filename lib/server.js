'use strict';

var config = require('../config/' + (process.env.MALACHITE_ENV || 'development') + '.json');

var express = require('express');
var bodyParser = require('body-parser');

var log = require('bunyan').createLogger(config.loggerOptions);

var app = express();

var dataStore = require('./dao/data-store.js');
var models = require('./dao/models.js');

app.use(express.static('./web'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// -----------------------------------------------------------------------------
// Middleware functions
// -----------------------------------------------------------------------------

var endpointLogger = function (req, res, next) {
    log.debug('%s %s', req.method, req.url);

    if (req.method === 'POST' || req.method === 'PUT') {
        log.debug('%j', req.body);
    }

    next();
};

var tokenPolice = function(req, res, next) {

    var safePaths = ['/config'];

    if (!req.query.token && (safePaths.indexOf(req.url) === -1)) {
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

app.get('/bookmarks/group/:groupId', function(req, res) {

    log.info('Token: ' + req.query.token);
    log.info('Group ID : ' + req.params.groupId);

    dataStore.get(models.BookmarkModel, { 'userId': 2 }, {}, function (err, bookmarks) {
        res.status(200).send(JSON.stringify(bookmarks));
    });

});

app.get('/groups', function(req, res) {

    console.log('Token: ' + req.query.token);

    dataStore.get(models.GroupModel, { 'userId': 2 }, {}, function (err, groups) {
        res.status(200).send(JSON.stringify(groups));
    });

});

// -----------------------------------------------------------------------------
// The last bit
// -----------------------------------------------------------------------------

app.listen(config.port, function() {
    log.info('Server running on port %d', config.port);
    log.info('Loaded %s environment config', (process.env.MALACHITE_ENV || 'development'));
});
