# node-wrtc-agent
WebRTC agent for load testing

# Installation

```bash
git clone git@github.com:netology-group/node-wrtc-agent.git
cd node-wrtc-agent
npm i

sudo npm link
```

# Options

```bash
$ wrtc-agent --help
Options:
  --version             Show version number                            [boolean]
  -c, --client-id       Client id for mqtt-client            [string] [required]
  -e, --endpoint        HTTP API endpoint for Conference     [string] [required]
  -n, --name            Conference app name                  [string] [required]
  -P, --password        Password for mqtt-client             [string] [required]
  -r, --room-id         Conference room id                   [string] [required]
  --relay-only          Use only "relay" ICE candidates                [boolean]
  --stun                STUN server URL                      [string] [required]
  --turn                TURN server URL                      [string] [required]
  --turn-password       TURN password                        [string] [required]
  --turn-username       TURN username                        [string] [required]
  -u, --uri             MQTT broker URI                      [string] [required]
  -ulms                 HTTP API endpoint for ULMS           [string] [required]
  --vc, --video-codec   Codec name for video (SDP)
                      [string] [choices: "VP8", "VP9"] [default: "VP8"]
  --help                Show help                                      [boolean]
```

# Usage

```bash
#!/usr/bin/env bash

ACCESS_TOKEN=foobar
BROKER_URI=wss://example.org/
CONFERENCE_API_ENDPOINT=https://example.org/api
CONFERENCE_ROOM_ID=ea3f9fd1-3356-43b4-b709-b7cfc563ea59
STUN_URL=stun:stun.example.org:3478
TURN_PASSWORD=password
TURN_URL=turn:example.org:3478
TURN_USERNAME=username
ULMS_API_ENDPOINT=https://example.org/api
ULMS_CLASSROOM_ID=ea3f9fd1-3356-43b4-b709-b7cfc563ea59

wrtc-agent \
  -c web.john-doe.example.org \
  --classroom-id "${ULMS_CLASSROOM_ID}" \
  -e ${CONFERENCE_API_ENDPOINT} \
  -P ${ACCESS_TOKEN} \
  -r ${CONFERENCE_ROOM_ID} \
  --relay-only \
  --stun ${STUN_URL} \
  --turn ${TURN_URL} \
  --turn-username ${TURN_USERNAME} \
  --turn-password ${TURN_PASSWORD} \
  -u ${BROKER_URI} \
  --ulms ${ULMS_API_ENDPOINT}
```
