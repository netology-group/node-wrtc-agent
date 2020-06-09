#!/usr/bin/env bash

index=$1
n=$2

users=()

tokens=()

total=${#users[*]}

BROKER_URI=
CONFERENCE_APP_NAME=
CONFERENCE_ROOM_ID=
STUN_URL=
TELEMETRY_APP_NAME=
TURN_URL=
TURN_USERNAME=
TURN_PASSWORD=

#
# different labels
#
for (( i=0; i<$n; i++ ))
do
  wrtc-agent \
    -c wrtc-$i.${users[index]} \
    -n ${CONFERENCE_APP_NAME} \
    -P ${tokens[index]} \
    -r ${CONFERENCE_ROOM_ID} \
    --stun ${STUN_URL} \
    --telemetry ${TELEMETRY_APP_NAME} \
    --turn ${TURN_URL} \
    --turn-username ${TURN_USERNAME} \
    --turn-password ${TURN_PASSWORD} \
    -u ${BROKER_URI} &

  echo $!

  sleep 5
done

wait
#pkill -P $$
