PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

INSERT INTO `users` (id,email,screenName,password,dateCreated) VALUES (1,'leonieb3@gmail.com','Leonie','abc123',NULL);
INSERT INTO `users` (id,email,screenName,password,dateCreated) VALUES (2,'nobbyknox@gmail.com','Nobby','abc123',NULL);

INSERT INTO `groups` (id,name,userId,levelNum,parentGroupId,dateCreated) VALUES (1,'ECN',2,1,NULL,NULL);
INSERT INTO `groups` (id,name,userId,levelNum,parentGroupId,dateCreated) VALUES (2,'VBX',2,2,1,NULL);
INSERT INTO `groups` (id,name,userId,levelNum,parentGroupId,dateCreated) VALUES (3,'Asterisk',2,2,1,NULL);

INSERT INTO `bookmarks` (id,title,address,dateCreated,rating,userId) VALUES (1,'Slack','http://ecn-za.slack.com/','2015-11-13 18:44:00',1,2);
INSERT INTO `bookmarks` (id,title,address,dateCreated,rating,userId) VALUES (2,'Youtube','http://www.youtube.co.za/','2015-11-13 18:44:00',5,2);
INSERT INTO `bookmarks` (id,title,address,dateCreated,rating,userId) VALUES (3,'Google','http://www.google.co.za/','2015-11-13 18:44:00',1,2);

INSERT INTO `bookmarks_groups` (id,bookmarkId,groupId,dateCreated) VALUES (1,1,1,'2015-11-14 13:00:00');
INSERT INTO `bookmarks_groups` (id,bookmarkId,groupId,dateCreated) VALUES (2,2,1,'2015-11-14 13:00:00');
INSERT INTO `bookmarks_groups` (id,bookmarkId,groupId,dateCreated) VALUES (3,3,1,'2015-11-14 13:00:00');

INSERT INTO `tags` (id,name,dateCreated,userId) VALUES (1,'JavaScript','2015-11-14 13:00:00', 2);
INSERT INTO `tags` (id,name,dateCreated,userId) VALUES (2,'Java','2015-11-14 13:05:00', 2);

INSERT INTO `bookmarks_tags` (id,bookmarkId,tagId,dateCreated) VALUES (1,1,1,'2015-11-14 13:05:00');
INSERT INTO `bookmarks_tags` (id,bookmarkId,tagId,dateCreated) VALUES (2,2,2,'2015-11-14 13:07:00');

COMMIT;
