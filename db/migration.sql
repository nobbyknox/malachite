-- Version 0.9.0
ALTER TABLE "bookmarks" ADD COLUMN `notes` TEXT;

-- Version 0.9.1
ALTER TABLE "bookmarks" ADD COLUMN `thumb` TEXT DEFAULT 'blank.png';
update bookmarks set thumb = 'blank.png' where thumb is null;

-- Version 0.9.2
CREATE TABLE "bookmarks_meta" (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`bookmarkId`	INTEGER NOT NULL,
	`attr`	TEXT NOT NULL,
	`value`	TEXT NOT NULL
);
