'use strict';

var bookshelf = require('./bookshelf.js');

/*
 * Check these out:
 * 1. http://dangertomanifold.com/working-with-relational-data-in-bookshelf-js/
 */

var UserModel = bookshelf.Model.extend({tableName: 'users'});

var BookmarkModel = bookshelf.Model.extend({
    tableName: 'bookmarks',
    bookmarks: function() {
        return this.belongsToMany(GroupModel).through(BookmarkGroupModel, 'bookmarkId', 'groupId');
    }
});

var BookmarkGroupModel = bookshelf.Model.extend({
    tableName: 'bookmarks_groups'
});

var GroupModel = bookshelf.Model.extend({
    tableName: 'groups',

    bookmarks: function() {
        return this.belongsToMany(BookmarkModel).through(BookmarkGroupModel, 'groupId', 'bookmarkId');
    }
});

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    BookmarkModel: BookmarkModel,
    UserModel: UserModel,
    BookmarkGroupModel: BookmarkGroupModel,
    GroupModel: GroupModel
};
