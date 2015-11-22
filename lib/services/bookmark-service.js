'use strict';

var helper = require('../helper.js');
var dataStore = require('../dao/data-store.js');
var models = require('../dao/models.js');
var config = helper.getConfig();
var log = require('bunyan').createLogger(config.loggerOptions);

var util = require('util');

function saveBookmark(bookmarkWrapper, next) {

    if (!bookmarkWrapper || !bookmarkWrapper.model) {
        next(new Error('Bookmark not specified'));
        return;
    }

    log.trace(bookmarkWrapper);

    if (bookmarkWrapper.model.id && bookmarkWrapper.model.id > 0) {
        dataStore.update(models.BookmarkModel, {'id': bookmarkWrapper.model.id, 'userId': bookmarkWrapper.model.userId}, {}, bookmarkWrapper.model, function(err) {

            manageTagAssociation(bookmarkWrapper, function(err) {
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

function manageTagAssociation(wrapper, next) {

    unlinkRemovedTags(wrapper, function(err) {
        if (err) {
            next(err);
        } else {
            addAndLinkNewTags(wrapper, function(err) {
                next(err);
            })
        }
    });
}

function unlinkRemovedTags(wrapper, next) {

    var existingTagObjects = [];
    var submittedTagObjects = [];
    var tagIdsToUnlink = [];

    var tagNameString = '';

    wrapper.tagNames.forEach(function(name) {
        tagNameString += "'" + name + "',";
    });

    tagNameString = tagNameString.replace(/(,\s*$)/g, '');  // Trim trailing commas

    log.trace('tagNameString: %s', tagNameString);

    dataStore.raw(util.format('select id, name from tags where userId = %d and name in (%s)', wrapper.model.userId, tagNameString), function(err, submittedData) {

        submittedData.forEach(function(item) {
            submittedTagObjects.push(item);
        });
        log.trace('submittedTagObjects: $j', submittedTagObjects);

        dataStore.raw(util.format('select id, name from tags where id in (select tagId from bookmarks_tags where bookmarkId = %d)', wrapper.model.id), function(err, existingData) {

            existingData.forEach(function(item) {
                existingTagObjects.push(item);
            });
            log.trace('existingTagObjects: $j', existingTagObjects);

            existingTagObjects.forEach(function(item) {

                var found = false;

                if (item) {
                    submittedTagObjects.forEach(function(submittedItem) {
                        if (submittedItem.name === item.name) {
                            found = true;
                        }
                    });

                    if (!found) {
                        tagIdsToUnlink.push(item.id);
                    }
                }
            });

            log.trace('Tag IDs to unlink from bookmark %d: %j', wrapper.model.id, tagIdsToUnlink);

            if (tagIdsToUnlink && tagIdsToUnlink.length > 0) {
                var tagIdString = tagIdsToUnlink.join(',');
                log.trace('tagIdString: %s', tagIdString);
                dataStore.raw(util.format('delete from bookmarks_tags where tagId in (%s)', tagIdString), function(err) {
                    next();
                });
            } else {
                next();
            }
        });
    });

}

function addAndLinkNewTags(wrapper, next) {

    createNewTags(wrapper, function(err) {
        if (err) {
            next(err);
        } else {
            linkNewTags(wrapper, function(err) {
                next(err);
            })
        }
    });

}

function createNewTags(wrapper, next) {

    if (wrapper.tagNames && wrapper.tagNames.length > 0) {

        var remaining = 0;

        wrapper.tagNames.forEach(function(tagName) {

            remaining++;

            dataStore.get(models.TagModel, { userId: wrapper.model.userId, name: tagName }, {}, function(err, data) {
                if (err) {
                    next(err);
                    return;
                } else {

                    if (data && data.length === 0) {
                        log.trace('Tag name %s does not exist and will be created', tagName);

                        var model = {
                            userId: wrapper.model.userId,
                            name: tagName,
                            dateCreated: helper.currentDatestamp()
                        };

                        dataStore.create(models.TagModel, model, function(err, createdTag) {
                            if (err) {
                                next(err);
                                return;
                            } else {
                                remaining--;
                                if (remaining === 0) {
                                    next();
                                    return;
                                }
                            }
                        });
                    } else {
                        log.trace('Tag name %s exists and will not be created', tagName);
                        remaining--;
                        if (remaining === 0) {
                            next();
                            return;
                        }
                    }
                }
            });
        });
    } else {
        next();
    }
}

function linkNewTags(wrapper, next) {

    var existingTagObjects = [];
    var submittedTagObjects = [];
    var tagIdsToLink = [];

    var tagNameString = '';

    wrapper.tagNames.forEach(function(name) {
        tagNameString += "'" + name + "',";
    });

    tagNameString = tagNameString.replace(/(,\s*$)/g, '');  // Trim trailing commas

    log.trace('tagNameString: %s', tagNameString);

    dataStore.raw(util.format('select id, name from tags where userId = %d and name in (%s)', wrapper.model.userId, tagNameString), function(err, submittedData) {

        submittedData.forEach(function(item) {
            submittedTagObjects.push(item);
        });
        log.trace('submittedTagObjects: $j', submittedTagObjects);

        dataStore.raw(util.format('select id, name from tags where id in (select tagId from bookmarks_tags where bookmarkId = %d)', wrapper.model.id), function(err, existingData) {

            existingData.forEach(function(item) {
                existingTagObjects.push(item);
            });
            log.trace('existingTagObjects: $j', existingTagObjects);

            submittedTagObjects.forEach(function(item) {

                var found = false;

                if (item) {
                    existingTagObjects.forEach(function(existingItem) {
                        if (existingItem.name === item.name) {
                            found = true;
                        }
                    });

                    if (!found) {
                        tagIdsToLink.push(item.id);
                    }
                }
            });

            log.trace('Tag IDs to link to bookmark %d: %j', wrapper.model.id, tagIdsToLink);

            if (tagIdsToLink && tagIdsToLink.length > 0) {
                var tagIdString = tagIdsToLink.join(',');
                log.trace('tagIdString: %s', tagIdString);

                var remaining = 0;

                tagIdsToLink.forEach(function(tagId) {
                    remaining++;

                    var linkModel = {
                        bookmarkId: wrapper.model.id,
                        tagId: tagId,
                        dateCreated: helper.currentDatestamp()
                    };

                    dataStore.create(models.BookmarkTagModel, linkModel, function(err) {
                        if (err) {
                            next(err);
                            return;
                        } else {
                            remaining--;
                            if (remaining === 0) {
                                next();
                                return;
                            }
                        }
                    });
                });

            } else {
                next();
            }
        });
    });

}


// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    saveBookmark: saveBookmark
};
