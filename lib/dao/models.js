'use strict';

let bookshelf = require('./bookshelf.js');

/*
 * Check these out:
 * 1. http://dangertomanifold.com/working-with-relational-data-in-bookshelf-js/
 */

let UserModel = bookshelf.Model.extend({tableName: 'users'});
let TokenCacheModel = bookshelf.Model.extend({tableName: 'token_cache'});

let BookmarkModel = bookshelf.Model.extend({
    tableName: 'bookmarks',
    groups: function() {
        return this.belongsToMany(GroupModel).through(BookmarkGroupModel, 'bookmarkId', 'groupId');
    },
    tags: function() {
        return this.belongsToMany(TagModel).through(BookmarkTagModel, 'bookmarkId', 'tagId');
    },
    meta: function() {
        return this.hasMany(BookmarkMetaModel, 'bookmarkId');
    }
});

let BookmarkGroupModel = bookshelf.Model.extend({tableName: 'bookmarks_groups'});
let BookmarkMetaModel = bookshelf.Model.extend({ tableName: 'bookmarks_meta' });
let BookmarkTagModel = bookshelf.Model.extend({tableName: 'bookmarks_tags'});

let GroupModel = bookshelf.Model.extend({
    tableName: 'groups',
    bookmarks: function() {
        return this.belongsToMany(BookmarkModel).through(BookmarkGroupModel, 'groupId', 'bookmarkId');
    }
});

let TagModel = bookshelf.Model.extend({
    tableName: 'tags',
    bookmarks: function() {
        return this.belongsToMany(BookmarkModel).through(BookmarkTagModel, 'tagId', 'bookmarkId');
    }
});


// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    UserModel: UserModel,
    TokenCacheModel: TokenCacheModel,
    BookmarkModel: BookmarkModel,
    BookmarkGroupModel: BookmarkGroupModel,
    BookmarkMetaModel: BookmarkMetaModel,
    BookmarkTagModel: BookmarkTagModel,
    GroupModel: GroupModel,
    TagModel: TagModel
};
