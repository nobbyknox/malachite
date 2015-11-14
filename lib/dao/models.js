'use strict';

var bookshelf = require('./bookshelf.js');

/**
 * Table models
 */
var BookmarkModel = bookshelf.Model.extend({tableName: 'bookmark'});
var UserModel = bookshelf.Model.extend({tableName: 'user'});

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    BookmarkModel: BookmarkModel,
    UserModel: UserModel
};
