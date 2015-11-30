-- Version 0.9.0
ALTER TABLE "bookmarks" ADD COLUMN `notes` TEXT;

-- Version 0.9.1
ALTER TABLE "bookmarks" ADD COLUMN `thumb` TEXT DEFAULT 'blank.png';
update bookmarks set thumb = 'blank.png' where thumb is null;
