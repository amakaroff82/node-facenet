CREATE DATABASE remote:localhost/corevision root root

CREATE CLASS Image
CREATE PROPERTY Image.path STRING
CREATE PROPERTY Image.name STRING
CREATE PROPERTY Image.type STRING
CREATE PROPERTY Image.height INTEGER
CREATE PROPERTY Image.width INTEGER

CREATE CLASS User
CREATE PROPERTY User.firstName STRING
CREATE PROPERTY User.lastName STRING
CREATE PROPERTY User.image LINK Image
CREATE PROPERTY User.recognitionLevel INTEGER

CREATE CLASS Session
CREATE PROPERTY Session.firstName STRING
CREATE PROPERTY Session.user LINK User
CREATE PROPERTY Session.dateTime INTEGER
CREATE PROPERTY Session.isConfirmed BOOLEAN
CREATE PROPERTY Session.image LINK Image

CREATE CLASS Embedding
CREATE PROPERTY Embedding.signature EMBEDDEDLIST FLOAT
CREATE PROPERTY Embedding.dateTime INTEGER
CREATE PROPERTY Embedding.session LINK Session
CREATE PROPERTY Embedding.user LINK User
CREATE PROPERTY Embedding.image LINK Image
