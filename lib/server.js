'use strict';

var config = require('../config/' + (process.env.MALACHITE_ENV || 'development') + '.json');

var express = require('express');
var bodyParser = require('body-parser');

var log = require('bunyan').createLogger(config.loggerOptions);

var app = express();

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
// The last bit
// -----------------------------------------------------------------------------

app.listen(config.port, function() {
    log.info('Server running on port %d', config.port);
    log.info('Loaded %s environment config', (process.env.MALACHITE_ENV || 'development'));
});
