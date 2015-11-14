PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

INSERT INTO `users` (id,email,screenName,password,dateCreated) VALUES (1,'leonieb3@gmail.com','Leonie','abc123',NULL);
INSERT INTO `users` (id,email,screenName,password,dateCreated) VALUES (2,'nobbyknox@gmail.com','Nobby','abc123',NULL);

INSERT INTO `groups` (id,name,userId,levelNum,parentGroupId,dateCreated) VALUES (1,'ECN',2,1,NULL,NULL);
INSERT INTO `groups` (id,name,userId,levelNum,parentGroupId,dateCreated) VALUES (2,'VBX',2,2,1,NULL);
INSERT INTO `groups` (id,name,userId,levelNum,parentGroupId,dateCreated) VALUES (3,'Asterisk',2,2,1,NULL);

INSERT INTO `bookmarks` (id,title,address,dateCreated,rating,userId) VALUES (1,'Slack','http://ecn-za.slack.com/','2015-11-13 18:44:00',1,2);

INSERT INTO `bookmarkgroups` (id,userId,bookmarkId,groupId,dateCreated) VALUES (1,2,1,1,'2015-11-14 13:00:00');

COMMIT;
