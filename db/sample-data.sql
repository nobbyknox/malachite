PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

INSERT INTO `users` (id,email,screenName,password,dateCreated) VALUES (1,'superman@cave.com','Superman','18c28604dd31094a8d69dae60f1bcd347f1afc5a',NULL);
INSERT INTO `users` (id,email,screenName,password,dateCreated) VALUES (2,'batman@cave.com','Batman','5c6d9edc3a951cda763f650235cfc41a3fc23fe8',NULL);

INSERT INTO `groups` (id,userId,name,levelNum,parentGroupId,dateCreated) VALUES (1,2,'Work',1,NULL,NULL);
INSERT INTO `groups` (id,userId,name,levelNum,parentGroupId,dateCreated) VALUES (2,2,'More Work',2,1,NULL);
INSERT INTO `groups` (id,userId,name,levelNum,parentGroupId,dateCreated) VALUES (3,2,'Even More Work',2,1,NULL);

INSERT INTO `bookmarks` (id,userId,title,address,dateCreated,rating,starred) VALUES (1,2,'Slack','http://www.slack.com/','2015-11-13 18:44:00',1,1);
INSERT INTO `bookmarks` (id,userId,title,address,dateCreated,rating,starred) VALUES (2,2,'Youtube','http://www.youtube.co.za/','2015-11-13 18:44:00',5,0);
INSERT INTO `bookmarks` (id,userId,title,address,dateCreated,rating,starred) VALUES (3,2,'Google','http://www.google.co.za/','2015-11-13 18:44:00',1,1);

INSERT INTO `bookmarks_groups` (id,bookmarkId,groupId,dateCreated) VALUES (1,1,1,'2015-11-14 13:00:00');
INSERT INTO `bookmarks_groups` (id,bookmarkId,groupId,dateCreated) VALUES (2,2,1,'2015-11-14 13:00:00');
INSERT INTO `bookmarks_groups` (id,bookmarkId,groupId,dateCreated) VALUES (3,3,1,'2015-11-14 13:00:00');

INSERT INTO `tags` (id,userId,name,dateCreated) VALUES (1,2,'JavaScript','2015-11-14 13:00:00');
INSERT INTO `tags` (id,userId,name,dateCreated) VALUES (2,2,'Java','2015-11-14 13:05:00');

INSERT INTO `bookmarks_tags` (id,bookmarkId,tagId,dateCreated) VALUES (1,1,1,'2015-11-14 13:05:00');
INSERT INTO `bookmarks_tags` (id,bookmarkId,tagId,dateCreated) VALUES (2,2,2,'2015-11-14 13:07:00');

COMMIT;
