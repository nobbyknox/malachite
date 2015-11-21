'use strict';

var helper = require('../helper.js');
var dataStore = require('../dao/data-store.js');
var models = require('../dao/models.js');
var config = helper.getConfig();
var log = require('bunyan').createLogger(config.loggerOptions);

function saveBookmark(bookmarkWrapper, next) {

    if (!bookmarkWrapper || !bookmarkWrapper.model) {
        next(new Error('Bookmark not specified'));
        return;
    }

    log.debug(bookmarkWrapper);

    if (bookmarkWrapper.model.id && bookmarkWrapper.model.id > 0) {
        dataStore.update(models.BookmarkModel, {'id': bookmarkWrapper.model.id, 'userId': bookmarkWrapper.model.userId}, {}, bookmarkWrapper.model, function(err) {

            manageTagAssociation(bookmarkWrapper.model.id, bookmarkWrapper.tagNames, function(err) {
                next(err);
            });

        });
    } else {
        dataStore.create(models.BookmarkModel, bookmarkWrapper.model, function(err, data) {
            log.info('New bookmark ID %d', data.id);
            next(err);
        });
    }

    next();

}


// -----------------------------------------------------------------------------
// Private functions
// -----------------------------------------------------------------------------

function manageTagAssociation(bookmarkId, tagNames, next) {
    // TODO:
    // 1 - Create new tags if required
    // 2 - Associate bookmark with tag (tableName: bookmarks_tags)
}

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    saveBookmark: saveBookmark
};
