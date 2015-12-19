'use strict';

let ValidationError = require('../classes/validation-error.js');
let helper = require('../helper.js');
//let dataStore = require('../dao/data-store.js');
//let models = require('../dao/models.js');
let config = helper.getConfig();

let log = require('bunyan').createLogger(config.loggerOptions);

function validateBookmark(bookmark, next) {

    let err = new ValidationError();

    if (!bookmark) {
        err.addError('Bookmark object not specified');
        next(err);
    } else {
        if (!bookmark.title || bookmark.title.trim().length === 0) {
            err.addPropError('title', 'Title is required');
        }

        if (!bookmark.address || bookmark.address.trim().length === 0) {
            err.addPropError('address', 'Address is required');
        }

        if (err.hasErrors()) {
            log.debug('Validation errors: %j', err.getAllErrors());
            next(err);
        } else {
            next();
        }
    }

}


// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    validateBookmark: validateBookmark
};
