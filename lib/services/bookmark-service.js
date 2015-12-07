'use strict';

var constants = require('../constants.js');
var helper = require('../helper.js');
var dataStore = require('../dao/data-store.js');
var models = require('../dao/models.js');
var config = helper.getConfig();
var log = require('bunyan').createLogger(config.loggerOptions);

var util = require('util');


function getThumblessBookmarks(next) {

    var options = {
        where: { 'thumb': config.defaultThumbnail },
        orWhere: { 'thumb': null },
        related: ['meta']
        //limit: config.thumbnailProcessingLimit
    };

    dataStore.superGet(models.BookmarkModel, options, function(err, bookmarks) {
        if (err) {
            next(err);
        } else {

            if (!bookmarks || bookmarks.length === 0) {
                next();
                return;
            }

            var forProcessing = [];

            bookmarks.forEach(function(bookmarkItem) {

                //if (forProcessing.length >= config.thumbnailProcessingLimit) {
                //    next(null, forProcessing);
                //    return;
                //}

                if (forProcessing.length < config.thumbnailProcessingLimit) {  // TODO: Not very efficient. Improve it.
                    if (!bookmarkItem.meta || bookmarkItem.meta.length === 0) {
                        log.debug('Selected bookmark %d for thumbnail processing - no thumbnail + no meta data', bookmarkItem.id);
                        forProcessing.push(bookmarkItem);
                    } else {
                        var metaFound = false;

                        bookmarkItem.meta.forEach(function(metaItem) {
                            if (metaItem.attr === constants.BOOKMARK_ATTR_THUMB_UNREACHABLE) {

                                metaFound = true;

                                if (metaItem.value !== '1') {
                                    log.debug('Selected bookmark %d for thumbnail processing - no thumbnail + not marked as unreachable', bookmarkItem.id);
                                    forProcessing.push(bookmarkItem);
                                } else {
                                    log.debug('Skipping bookmark %d for thumbnail processing - not reachable', bookmarkItem.id);
                                }
                            }
                        });
                        if (!metaFound) {
                            log.debug('Selected bookmark %d for thumbnail processing - no thumbnail + meta attribute %s not found', bookmarkItem.id, constants.BOOKMARK_ATTR_THUMB_UNREACHABLE);
                            forProcessing.push(bookmarkItem);
                        }
                    }
                }
            });

            next(null, forProcessing);
        }
    });

}

function refreshThumbnail(id, next) {
    dataStore.remove(models.BookmarkMetaModel, { bookmarkId: id, attr: constants.BOOKMARK_ATTR_THUMB_UNREACHABLE }, {}, true, function(err) {
        if (err) {
            next(err);
        } else {
            dataStore.update(models.BookmarkModel, { id: id }, {}, { thumb: 'blank.png' }, function(err) {
                next(err);
            });
        }
    });
}

function saveBookmark(bookmarkWrapper, next) {

    if (!bookmarkWrapper || !bookmarkWrapper.model) {
        next(new Error('Bookmark not specified'));
        return;
    }

    log.trace(bookmarkWrapper);

    if (bookmarkWrapper.model.id && bookmarkWrapper.model.id > 0) {
        dataStore.update(models.BookmarkModel, {'id': bookmarkWrapper.model.id, 'userId': bookmarkWrapper.model.userId}, {}, bookmarkWrapper.model, function(err) {

            manageGroupAssociation(bookmarkWrapper, function(err) {
                if (err) {
                    next(err);
                    return;
                } else {
                    manageTagAssociation(bookmarkWrapper, function(err) {
                        next(err);
                    });
                }
            });
        });
    } else {

        bookmarkWrapper.model.dateCreated = helper.currentDatestamp();

        dataStore.create(models.BookmarkModel, bookmarkWrapper.model, function(err, data) {
            log.info('New bookmark ID %d', data.id);
            bookmarkWrapper.model.id = data.id;

            manageGroupAssociation(bookmarkWrapper, function(err) {
                if (err) {
                    next(err);
                    return;
                } else {
                    manageTagAssociation(bookmarkWrapper, function(err) {
                        next(err);
                    });
                }
            });

            //next(err);
        });
    }

}

function setThumbnail(id, thumb, next) {

    dataStore.update(models.BookmarkModel, { 'id': id }, {}, { 'thumb': (thumb ? thumb : 'blank.png') }, function(err) {

        //log.debug('Setting bookmark ID %d thumbnail to %s', id, thumb);

        upsertMeta(id, constants.BOOKMARK_ATTR_THUMB_PROCESSED_ON, helper.currentDatestamp(), function(err) {
            if (err) {
                next(err);
            } else {
                upsertMeta(id, constants.BOOKMARK_ATTR_THUMB_UNREACHABLE, (!thumb), function(err) {
                    next(err);
                });
            }
        });

    });

}


// -----------------------------------------------------------------------------
// Private functions
// -----------------------------------------------------------------------------

function manageGroupAssociation(wrapper, next) {

    unlinkRemovedGroups(wrapper, function(err) {
        if (err) {
            next(err);
        } else {
            addAndLinkNewGroups(wrapper, function(err) {
                next(err);
            })
        }
    });
}

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

function unlinkRemovedGroups(wrapper, next) {

    var existingGroupObjects = [];
    var submittedGroupObjects = [];
    var groupIdsToUnlink = [];

    var groupNameString = '';

    wrapper.groupNames.forEach(function(name) {
        groupNameString += "'" + name + "',";
    });

    groupNameString = groupNameString.replace(/(,\s*$)/g, '');  // Trim trailing commas

    log.trace('groupNameString: %s', groupNameString);

    dataStore.raw(util.format('select id, name from groups where userId = %d and name in (%s)', wrapper.model.userId, groupNameString), function(err, submittedData) {

        submittedData.forEach(function(item) {
            submittedGroupObjects.push(item);
        });
        log.trace('submittedGroupObjects: $j', submittedGroupObjects);

        dataStore.raw(util.format('select id, name from groups where id in (select groupId from bookmarks_groups where bookmarkId = %d)', wrapper.model.id), function(err, existingData) {

            existingData.forEach(function(item) {
                existingGroupObjects.push(item);
            });
            log.trace('existingGroupObjects: $j', existingGroupObjects);

            existingGroupObjects.forEach(function(item) {

                var found = false;

                if (item) {
                    submittedGroupObjects.forEach(function(submittedItem) {
                        if (submittedItem.name === item.name) {
                            found = true;
                        }
                    });

                    if (!found) {
                        groupIdsToUnlink.push(item.id);
                    }
                }
            });

            log.trace('Group IDs to unlink from bookmark %d: %j', wrapper.model.id, groupIdsToUnlink);

            if (groupIdsToUnlink && groupIdsToUnlink.length > 0) {
                var groupIdString = groupIdsToUnlink.join(',');
                log.trace('groupIdString: %s', groupIdString);
                dataStore.raw(util.format('delete from bookmarks_groups where groupId in (%s)', groupIdString), function(err) {
                    next(err);
                });
            } else {
                next();
            }
        });
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
                    next(err);
                });
            } else {
                next();
            }
        });
    });

}

function addAndLinkNewGroups(wrapper, next) {

    createNewGroups(wrapper, function(err) {
        if (err) {
            next(err);
        } else {
            linkNewGroups(wrapper, function(err) {
                next(err);
            })
        }
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

function createNewGroups(wrapper, next) {

    if (wrapper.groupNames && wrapper.groupNames.length > 0) {

        var remaining = 0;

        wrapper.groupNames.forEach(function(groupName) {

            remaining++;

            dataStore.get(models.GroupModel, { userId: wrapper.model.userId, name: groupName }, {}, function(err, data) {
                if (err) {
                    next(err);
                    return;
                } else {

                    if (data && data.length === 0) {
                        log.trace('Group name %s does not exist and will be created', groupName);

                        var model = {
                            userId: wrapper.model.userId,
                            name: groupName,
                            levelNum: 1,
                            parentGroupId: null,
                            dateCreated: helper.currentDatestamp()
                        };

                        dataStore.create(models.GroupModel, model, function(err, createdTag) {
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
                        log.trace('Group name %s exists and will not be created', groupName);
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

function linkNewGroups(wrapper, next) {

    var existingGroup = [];
    var submittedGroupObjects = [];
    var groupIdsToLink = [];

    var groupNameString = '';

    wrapper.groupNames.forEach(function(name) {
        groupNameString += "'" + name + "',";
    });

    groupNameString = groupNameString.replace(/(,\s*$)/g, '');  // Trim trailing commas

    log.trace('groupNameString: %s', groupNameString);

    dataStore.raw(util.format('select id, name from groups where userId = %d and name in (%s)', wrapper.model.userId, groupNameString), function(err, submittedData) {

        submittedData.forEach(function(item) {
            submittedGroupObjects.push(item);
        });
        log.trace('submittedGroupObjects: $j', submittedGroupObjects);

        dataStore.raw(util.format('select id, name from groups where id in (select groupId from bookmarks_groups where bookmarkId = %d)', wrapper.model.id), function(err, existingData) {

            existingData.forEach(function(item) {
                existingGroup.push(item);
            });
            log.trace('existingGroup: $j', existingGroup);

            submittedGroupObjects.forEach(function(item) {

                var found = false;

                if (item) {
                    existingGroup.forEach(function(existingItem) {
                        if (existingItem.name === item.name) {
                            found = true;
                        }
                    });

                    if (!found) {
                        groupIdsToLink.push(item.id);
                    }
                }
            });

            log.trace('Groups IDs to link to bookmark %d: %j', wrapper.model.id, groupIdsToLink);

            if (groupIdsToLink && groupIdsToLink.length > 0) {
                var groupIdString = groupIdsToLink.join(',');
                log.trace('groupIdString: %s', groupIdString);

                var remaining = 0;

                groupIdsToLink.forEach(function(groupId) {
                    remaining++;

                    var linkModel = {
                        bookmarkId: wrapper.model.id,
                        groupId: groupId,
                        dateCreated: helper.currentDatestamp()
                    };

                    dataStore.create(models.BookmarkGroupModel, linkModel, function(err) {
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

function upsertMeta(bookmarkId, attr, value, next) {

    dataStore.get(models.BookmarkMetaModel, { 'bookmarkId': bookmarkId, 'attr': attr }, {}, function(err, metas) {

        //log.debug('After find of meta for bookmark %d and attr %s', bookmarkId, attr);
        //log.debug('err: ', err);
        //log.debug('metas: %j', metas);

        if (err || !metas || metas.length === 0) {
            //log.debug('Creating bookmark meta %s with value %s for bookmark %d', attr, value, bookmarkId);
            dataStore.create(models.BookmarkMetaModel, { 'bookmarkId': bookmarkId, 'attr': attr, 'value': value}, function(err) {
                next(err);
            });
        } else {
            //log.debug('Updating bookmark ID %d meta key %s with value %s', bookmarkId, attr, value);
            dataStore.update(models.BookmarkMetaModel, { 'id': metas[0].id }, {}, { 'value': value }, function(err) {
                next(err);
            })
        }
    });
}


// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    getThumbLessBookmarks: getThumblessBookmarks,
    refreshThumbnail: refreshThumbnail,
    saveBookmark: saveBookmark,
    setThumbnail: setThumbnail
};
