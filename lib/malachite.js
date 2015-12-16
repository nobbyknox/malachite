'use strict';

let helper = require('./helper.js');
let config = helper.getConfig();
let constants = require('./constants.js');

let authService = require('./services/authentication-service.js');
let bookmarkService = require('./services/bookmark-service.js');

let express = require('express');
let bodyParser = require('body-parser');

let log = require('bunyan').createLogger(config.loggerOptions);
let util = require('util');

let app = express();

let dataStore = require('./dao/data-store.js');
let models = require('./dao/models.js');

app.use(express.static('./web'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


// -----------------------------------------------------------------------------
// Middleware functions
// -----------------------------------------------------------------------------

let endpointLogger = function(req, res, next) {
    log.debug('%s %s', req.method, req.url);

    if (req.method === 'POST' || req.method === 'PUT') {
        log.debug('%j', req.body);
    }

    next();
};

let tokenPolice = function(req, res, next) {

    let safePaths = ['/config', '/authenticate', '/validatetoken', '/system/nothumbs', '/system/updatethumbs', '/files', '/thumbs'];

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
                log.trace('Authentication response: %j', authResp);
                res.status(constants.HTTP_OKAY).send(JSON.stringify(authResp));
            }
        });
    }
});

app.post('/validatetoken', function(req, res) {

    if (!req.body || !req.body.token) {
        res.status(constants.HTTP_UNAUTHORIZED).send(new Error('No token specified to validate'));
    } else {

        authService.validateToken(req.body.token, function(err) {
            if (err) {
                log.error(err);
                res.status(constants.HTTP_UNAUTHORIZED).send(err);
            } else {
                log.trace('Token %s is valid', req.body.token);
                res.status(constants.HTTP_OKAY).send('');
            }
        });
    }

});

app.post('/globallogout', function(req, res) {

    if (!req.body || !req.body.userId) {
        res.status(constants.HTTP_INVALID_ENTITY).send('User ID not supplied');
    } else {
        authService.removeAllUserTokens(req.query.__userId, req.body.userId, function(err) {
            if (err) {
                res.status(constants.HTTP_INVALID_ENTITY).send(err);
            } else {
                res.status(constants.HTTP_OKAY).send('');
            }
        });
    }
});


// -----------------------------------------------------------------------------
// Bookmarks
// -----------------------------------------------------------------------------

app.get('/bookmarks', function(req, res) {

    let options = {
        where: {
            userId: req.query.__userId
        },
        related: ['groups', 'tags'],
        like: []
    };

    if (req.query.starred && req.query.starred === '1') {
        options.where.starred = 1;
    }

    if (req.query.query && req.query.query.length > 0) {
        options.like.push({column: 'title', value: req.query.query});
    }

    dataStore.superGet(models.BookmarkModel, options, function(err, bookmarks) {
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

    dataStore.getWithDependents(models.BookmarkModel, {
        'id': req.params.id,
        'userId': req.query.__userId
    }, ['groups', 'tags', 'meta'], function(err, bookmarks) {
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

    let bookmarkWrapper = req.body;
    bookmarkWrapper.model.userId = req.query.__userId;

    bookmarkService.saveBookmark(bookmarkWrapper, function(err, data) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });

});

app.post('/bookmarks/refreshthumbnail', function(req, res) {

    bookmarkService.refreshThumbnail(req.body.id, function(err) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);  // FIXME: This does not work
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });

});

app.put('/bookmarks', function(req, res) {

    bookmarkService.saveBookmark(req.body, function(err) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });

});

app.delete('/bookmarks/:id', function(req, res) {
    bookmarkService.deleteBookmark(req.params.id, req.query.__userId, function(err) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            res.status(constants.HTTP_OKAY).end();
        }
    });
});

app.get('/bookmarks/group/:name', function(req, res) {

    dataStore.raw(util.format('select * from groups where userId = %d and name = \'%s\'', req.query.__userId, req.params.name), function(err, data) {

        if (data && data.length > 0) {

            let options = {
                where: {
                    userId: req.query.__userId
                },
                related: ['groups', 'tags'],
                like: [],
                'join': {
                    'tableName': 'bookmarks_groups',
                    'on': ['bookmarks.id', '=', 'bookmarks_groups.bookmarkId'],
                    'andOn': [
                        ['bookmarks_groups.groupId', '=', data[0].id]
                    ]
                }
            };

            dataStore.superGet(models.BookmarkModel, options, function(err, bookmarks) {

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

        } else {
            res.status(404).send('');
        }

    });

});

app.get('/bookmarks/tag/:name', function(req, res) {

    dataStore.raw(util.format('select * from tags where userId = %d and name = \'%s\'', req.query.__userId, req.params.name), function(err, data) {

        if (data && data.length > 0) {

            let options = {
                where: {
                    userId: req.query.__userId
                },
                related: ['groups', 'tags'],
                like: [],
                'join': {
                    'tableName': 'bookmarks_tags',
                    'on': ['bookmarks.id', '=', 'bookmarks_tags.bookmarkId'],
                    'andOn': [
                        ['bookmarks_tags.tagId', '=', data[0].id]
                    ]
                }
            };

            dataStore.superGet(models.BookmarkModel, options, function(err, bookmarks) {

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

        } else {
            res.status(404).send('');
        }

    });
});

app.post('/bookmarks/togglestar/:id', function(req, res) {
    bookmarkService.toggleStar(req.params.id, req.query.__userId, function(err, bookmark) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            if (!bookmark) {
                res.status(constants.HTTP_FILE_NOT_FOUND).send('');
            } else {
                res.status(constants.HTTP_OKAY).send(JSON.stringify(bookmark));
            }
        }
    });
});

app.get('/bookmarks/x/recent', function(req, res) {
    bookmarkService.recentlyAdded(req.query.__userId, function(err, bookmarks) {
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


// -----------------------------------------------------------------------------
// Groups
// -----------------------------------------------------------------------------

app.get('/groups', function(req, res) {

    let options = {
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

    let options = {
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


// -----------------------------------------------------------------------------
// Tags
// -----------------------------------------------------------------------------

app.get('/tags', function(req, res) {

    let options = {
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

    let options = {
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

    let tagModel = req.body;
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
// System API
// -----------------------------------------------------------------------------

app.get('/system/nothumbs', function(req, res) {

    bookmarkService.getThumbLessBookmarks(function(err, bookmarks) {
        if (err) {
            res.status(constants.HTTP_INVALID_ENTITY).send(err);
        } else {
            if (!bookmarks || bookmarks.length === 0) {
                res.status(constants.HTTP_FILE_NOT_FOUND).send('No bookmarks found that require thumbnail processing');
            } else {
                res.status(constants.HTTP_OKAY).send(JSON.stringify(bookmarks));
            }
        }
    });

});

/**
 * Updates thumbnails of bookmarks. Payload schema:
 *
 * [ { "id": 1, "thumb": "1.png" } ]
 *
 * The "thumb" property is null when screen shot could not be taken.
 */
app.post('/system/updatethumbs', function(req, res) {

    let remaining = 0;

    log.debug(req.body);

    if (req.body && req.body.length > 0) {
        req.body.forEach(function(item) {

            remaining++;
            log.debug(item.id, item.thumb);

            bookmarkService.setThumbnail(item.id, item.thumb, function(err) {

                remaining--;

                if (err) {
                    log.error(err);
                }

                if (remaining === 0) {
                    res.status(constants.HTTP_OKAY).send('complete');
                    return;
                }
            });
        });
    } else {
        log.warn('No payload received');
        res.status(constants.HTTP_INVALID_ENTITY).send('No payload received');
    }

});


// -----------------------------------------------------------------------------
// The last bit
// -----------------------------------------------------------------------------

app.listen(config.port, config.host, function() {
    console.log(util.format('Malachite server running on port %d and is bound to %s', config.port, config.host));

    console.log('');
    console.log('    __  ___      __           __    _ __     ');
    console.log('   /  |/  /___ _/ /___ ______/ /_  (_) /____ ');
    console.log('  / /|_/ / __ `/ / __ `/ ___/ __ \\/ / __/ _ \\');
    console.log(' / /  / / /_/ / / /_/ / /__/ / / / / /_/  __/');
    console.log('/_/  /_/\\__,_/_/\\__,_/\\___/_/ /_/_/\\__/\\___/ ');
    console.log('                                             ');
    console.log('              Version 0.9.4');
    console.log('');
});
