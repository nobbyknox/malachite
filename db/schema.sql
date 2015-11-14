BEGIN TRANSACTION;
CREATE TABLE "bookmarkgroups" (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`userId`	INTEGER NOT NULL,
	`bookmarkId`	INTEGER NOT NULL,
	`groupId`	INTEGER NOT NULL,
	`dateCreated`	TEXT
);
CREATE TABLE "bookmarks" (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`title`	TEXT NOT NULL,
	`address`	TEXT NOT NULL,
	`dateCreated`	TEXT,
	`rating`	INTEGER,
	`userId`	INTEGER NOT NULL
);
CREATE TABLE "groups" (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`name`	TEXT NOT NULL,
	`userId`	INTEGER NOT NULL,
	`levelNum`	INTEGER NOT NULL,
	`parentGroupId`	INTEGER,
	`dateCreated`	TEXT
);
CREATE TABLE "users" (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`email`	TEXT NOT NULL UNIQUE,
	`screenName`	TEXT NOT NULL UNIQUE,
	`password`      TEXT,
	`dateCreated`	TEXT
);
CREATE TABLE "tags" (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`name`	TEXT NOT NULL,
	`dateCreated`	TEXT,
	`userId`	INTEGER NOT NULL
);
CREATE TABLE "bookmarktags" (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`userId`	INTEGER NOT NULL,
	`bookmarkId`	INTEGER NOT NULL,
	`tagId`	INTEGER NOT NULL,
	`dateCreated`	TEXT
);
COMMIT;
