cd ../../orientdb
call ./bin/console.bat DROP DATABASE  remote:localhost/corevision root root
call ./bin/console.bat ../node-facenet/db/db.sql
