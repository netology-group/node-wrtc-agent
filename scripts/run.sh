#!/usr/bin/env bash

## Usage
#
# Parameters:
# N_AGENTS            | {number}  | *required*  | Number of agents to spawn
# CONFERENCE_ROOM_ID  | {uuid}    | *required*  | Room ID for Conference service
# SLEEP_SECONDS       | {number}  | optional    | Agent start interval (default - 1s)
#
# Example:
# bash scripts/run.sh {N_AGENTS} {CONFERENCE_ROOM_ID} [{SLEEP_SECONDS}]
# bash scripts/run.sh 250 f17d64bc-ceaa-4563-8c2e-432de7bfe91b 0.2

if [[ ! "${ACCESS_TOKEN}" ]]; then echo "ACCESS_TOKEN is required." 1>&2; exit 1; fi
if [[ ! "${ACCOUNT_ID}" ]]; then echo "ACCOUNT_ID is required." 1>&2; exit 1; fi
if [[ ! "${CONFERENCE_API_ENDPOINT}" ]]; then echo "CONFERENCE_API_ENDPOINT is required." 1>&2; exit 1; fi
if [[ ! "${CONFERENCE_APP_NAME}" ]]; then echo "CONFERENCE_APP_NAME is required." 1>&2; exit 1; fi
if [[ ! "${MQTT_BROKER_URI}" ]]; then echo "MQTT_BROKER_URI is required." 1>&2; exit 1; fi
if [[ ! "${STUN_URL}" ]]; then echo "STUN_URL is required." 1>&2; exit 1; fi
if [[ ! "${TURN_PASSWORD}" ]]; then echo "TURN_PASSWORD is required." 1>&2; exit 1; fi
if [[ ! "${TURN_URL}" ]]; then echo "TURN_URL is required." 1>&2; exit 1; fi
if [[ ! "${TURN_USERNAME}" ]]; then echo "TURN_USERNAME is required." 1>&2; exit 1; fi

N_AGENTS="${1}"
CONFERENCE_ROOM_ID="${2}"
SLEEP_SECONDS="${3:-1}"

if [[ ! "${N_AGENTS}" ]]; then echo "N_AGENTS is required." 1>&2; exit 1; fi
if [[ ! "${CONFERENCE_ROOM_ID}" ]]; then echo "CONFERENCE_ROOM_ID is required." 1>&2; exit 1; fi

# Create label prefix string based on machine hostname
HOST_ID=$(hostname | sha256sum)
LABEL_PREFIX=${HOST_ID:0:8}

for (( i=0; i<N_AGENTS; i++ ))
do
  wrtc-agent \
    -c "${LABEL_PREFIX}-${i}.${ACCOUNT_ID}" \
    -e "${CONFERENCE_API_ENDPOINT}" \
    -n "${CONFERENCE_APP_NAME}" \
    -P "${ACCESS_TOKEN}" \
    -r "${CONFERENCE_ROOM_ID}" \
    --stun "${STUN_URL}" \
    --turn "${TURN_URL}" \
    --turn-username "${TURN_USERNAME}" \
    --turn-password "${TURN_PASSWORD}" \
    -u "${MQTT_BROKER_URI}" &

  echo $!

  sleep "$SLEEP_SECONDS"
done

wait
