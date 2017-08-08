#!/bin/bash

# NOTE: this should be called from /data

IN="201704-citibike-tripdata.csv"
DATE="2017-04-18"
OUT="trips-$DATE.csv"
CLEANED_DIR="../cleaned"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

head -1 $IN > $OUT
cat $IN | grep $DATE >> $OUT
cat $OUT | node $DIR/clean-citibike-trips.js > $OUT.tmp
head -1 $OUT.tmp > $CLEANED_DIR/$OUT
cat $OUT.tmp | grep $DATE >> $CLEANED_DIR/$OUT
rm $OUT.tmp $OUT
