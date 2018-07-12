#!/usr/bin/env bash
cd ../../orientdb
rm -rf nc
../bin/console.sh ../../../nc/nc-server/db.sql
sh ../bin/nc ../databases

sh ./bin/console.sh DROP DATABASE  remote:localhost/corevision root root
sh ./bin/console.sh ../node-facenet/db/db.sql
