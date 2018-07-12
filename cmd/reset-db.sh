#!/usr/bin/env bash
cd ../../orientdb/databases
rm -rf corevision
../bin/console.sh ../../node-facenet/db/db.sql
mv ../bin/corevision ../databases
