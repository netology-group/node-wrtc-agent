#!/usr/bin/env bash

n=$1
room=$2
SLEEP_SECONDS="${3:-1}"

URI=ws://81.163.21.211:8188/
STUN_URL=stun:turn.staging01.svc.netology-group.services:3478
TURN_URL=turn:turn.staging01.svc.netology-group.services:3478
TURN_USERNAME=ntg
TURN_PASSWORD=password

for (( i=0; i<$n; i++ ))
do
  node jt.js \
    -r ${room} \
    --stun ${STUN_URL} \
    --turn ${TURN_URL} \
    --turn-username ${TURN_USERNAME} \
    --turn-password ${TURN_PASSWORD} \
    -u ${URI} &

  echo $!

  sleep $SLEEP_SECONDS
done

wait
