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

app.use(endpointLogger);


// -----------------------------------------------------------------------------
// The API
// -----------------------------------------------------------------------------

app.get('/config', function(req, res) {
    res.status(200).send(JSON.stringify(config.webOptions));
});

app.get('/bookmarks', function(req, res) {

    console.log('Token: ' + req.query.token);

    var dummyData = [];
    dummyData.push({ 'id': 1, 'title': 'Bing', 'address': 'http://www.bing.com/'});
    dummyData.push({ 'id': 2, 'title': 'Google', 'address': 'http://www.google.co.za/'});
    dummyData.push({ 'id': 3, 'title': 'Slashdot', 'address': 'http://slashdot.org/'});

    res.status(200).send(JSON.stringify(dummyData));
});

app.get('/groups', function(req, res) {

    //var dummyData = [];
    //dummyData.push({ 'id': 1, 'name': 'Favourite', 'userId': 2, 'levelNum': 1});
    //dummyData.push({ 'id': 2, 'name': 'Work', 'userId': 2, 'levelNum': 1});
    //dummyData.push({ 'id': 3, 'name': 'Toolbox', 'userId': 2, 'levelNum': 1});

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
