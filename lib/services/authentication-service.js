'use strict';

var helper = require('../helper.js');
var dataStore = require('../dao/data-store.js');
var models = require('../dao/models.js');
var config = helper.getConfig();
var log = require('bunyan').createLogger(config.loggerOptions);

var sha1 = require('sha1');

function authenticateUser(username, password, next) {

    dataStore.get(models.UserModel, {'email': username}, {}, function(err, userModels) {

        if (err) {
            next(err);
        } else {

            if (!userModels || userModels.length === 0) {
                next(new Error('Invalid username or password'));
            } else {
                if (userModels[0].password === sha1(password)) {

                    var tokenCache = {
                        userId: userModels[0].id,
                        token: guid(),
                        dateCreated: helper.currentDatestamp(),
                        dateUpdated: null
                    };

                    log.trace('tokenCache: %j', tokenCache);

                    dataStore.create(models.TokenCacheModel, tokenCache, function(err) {

                        var authResponse = {
                            userId: userModels[0].id,
                            username: userModels[0].email,
                            screenName: userModels[0].screenName,
                            token: tokenCache.token
                        };

                        //log.debug('Returning: ', authResponse);

                        next(err, authResponse);
                    });

                } else {
                    next(new Error('Invalid username or password'));
                }
            }
        }
    });
}


function getUserIdFromToken(token, next) {

    dataStore.get(models.TokenCacheModel, { 'token': token }, {}, function(err, tokenArray) {
        if (err) {
            next(err);
        } else {
            if (tokenArray && tokenArray.length > 0) {
                next(null, tokenArray[0].userId);
            } else {
                next(new Error('Invalid token ' + token));
            }
        }
    });

}

function validateToken(token, next) {

    if (!token) {
        next(new Error('No token specified'));
    }

    dataStore.get(models.TokenCacheModel, { 'token': token }, {}, function(err, tokenArray) {
        if (err) {
            next(err);
        } else {
            if (tokenArray && tokenArray.length > 0) {
                next(null);
            } else {
                next(new Error('Invalid token ' + token));
            }
        }
    });

}

// -----------------------------------------------------------------------------
// Private functions
// -----------------------------------------------------------------------------

// TODO: Maybe this can be replaced with a SHA1 hash or something?
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}


// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    authenticateUser: authenticateUser,
    getUserIdFromToken: getUserIdFromToken,
    validateToken: validateToken
};
