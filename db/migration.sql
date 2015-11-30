-- 2015-11-27
ALTER TABLE "bookmarks" ADD COLUMN `notes` TEXT;

-- 2015-11-30
ALTER TABLE "bookmarks" ADD COLUMN `thumb` TEXT DEFAULT 'blank.png';
update bookmarks set thumb = 'blank.png' where thumb is null;
