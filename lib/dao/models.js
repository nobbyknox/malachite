'use strict';

var bookshelf = require('./bookshelf.js');

/*
 * Check these out:
 * 1. http://dangertomanifold.com/working-with-relational-data-in-bookshelf-js/
 */

var UserModel = bookshelf.Model.extend({tableName: 'users'});
var TokenCacheModel = bookshelf.Model.extend({tableName: 'token_cache'});

var BookmarkModel = bookshelf.Model.extend({
    tableName: 'bookmarks',
    groups: function() {
        return this.belongsToMany(GroupModel).through(BookmarkGroupModel, 'bookmarkId', 'groupId');
    },
    tags: function() {
        return this.belongsToMany(TagModel).through(BookmarkTagModel, 'bookmarkId', 'tagId');
    }
});

var BookmarkGroupModel = bookshelf.Model.extend({ tableName: 'bookmarks_groups' });
var BookmarkTagModel = bookshelf.Model.extend({ tableName: 'bookmarks_tags' });

var GroupModel = bookshelf.Model.extend({
    tableName: 'groups',
    bookmarks: function() {
        return this.belongsToMany(BookmarkModel).through(BookmarkGroupModel, 'groupId', 'bookmarkId');
    }
});

var TagModel = bookshelf.Model.extend({
    tableName: 'tags',
    bookmarks: function() {
        return this.belongsToMany(BookmarkModel).through(BookmarkTagModel, 'tagId', 'bookmarkId');
    }
});

//var BookmarkTagLinkModel = bookshelf.Model.extend({tableName: 'bookmarks_tags'});

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    UserModel: UserModel,
    TokenCacheModel: TokenCacheModel,
    BookmarkModel: BookmarkModel,
    BookmarkGroupModel: BookmarkGroupModel,
    BookmarkTagModel: BookmarkTagModel,
    GroupModel: GroupModel,
    TagModel: TagModel
};
