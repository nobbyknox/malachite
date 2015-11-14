'use strict';

var bookshelf = require('./bookshelf.js');

/**
 * Table models
 */
var BookmarkModel = bookshelf.Model.extend({tableName: 'bookmarks'});
var UserModel = bookshelf.Model.extend({tableName: 'users'});
var GroupModel = bookshelf.Model.extend({tableName: 'groups'});

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    BookmarkModel: BookmarkModel,
    UserModel: UserModel,
    GroupModel: GroupModel
};
