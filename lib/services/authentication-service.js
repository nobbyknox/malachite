'use strict';

var helper = require('../helper.js');
var dataStore = require('../dao/data-store.js');
var models = require('../dao/models.js');

var sha1 = require('sha1');

function authenticateUser(username, password, next) {

    var authResponse = {};

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
                        dateCreated: null,
                        dateUpdated: null
                    };

                    createTokenCache(tokenCache, function(err) {
                        if (err) {
                            next(err);
                        } else {
                            authResponse.id = tokenCache.id;
                            authResponse.token = tokenCache.token;
                            next(null, authResponse);
                        }
                    });

                } else {
                    next(new Error('Invalid username or password'));
                }
            }
        }
    });
}


// -----------------------------------------------------------------------------
// Private functions
// -----------------------------------------------------------------------------

function createTokenCache(tokenCache, next) {

    dataStore.get(models.TokenCacheModel, { 'userId': tokenCache.userId }, {}, function(err, existingCache) {

        if (err) {
            next(err);
        } else {
            if (existingCache && existingCache.length > 0) {

                existingCache[0].token = tokenCache.token;
                existingCache[0].dateUpdated = helper.currentDatestamp();

                dataStore.update(models.TokenCacheModel, { 'userId': tokenCache.userId }, {}, existingCache[0], function(err) {
                    next(err);
                });
            } else {
                tokenCache.dateCreated = helper.currentDatestamp();
                dataStore.create(models.TokenCacheModel, tokenCache, function(err) {
                    next(err);
                });
            }
        }

    });

}

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
    authenticateUser: authenticateUser
};
