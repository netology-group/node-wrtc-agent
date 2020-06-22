# node-wrtc-agent
WebRTC agent for load testing

# Installation

```bash
git clone git@github.com:netology-group/node-wrtc-agent.git
cd node-wrtc-agent
npm i

# macOS
npm run copy-module-darwin
# or linux
npm run copy-module-linux

sudo npm link
```

# Options

```bash
$ wrtc-agent --help
Options:
  --version             Show version number                            [boolean]
  -c, --client-id       Client id for mqtt-client            [string] [required]
  -n, --name            Conference app name                  [string] [required]
  -P, --password        Password for mqtt-client             [string] [required]
  -r, --room-id         Conference room id                   [string] [required]
  --relay-only          Use only "relay" ICE candidates                [boolean]
  --stun                STUN server URL                      [string] [required]
  --telemetry           Telemetry app name                              [string]
  --telemetry-interval  Telemetry interval (ms)         [number] [default: 5000]
  --turn                TURN server URL                      [string] [required]
  --turn-password       TURN password                        [string] [required]
  --turn-username       TURN username                        [string] [required]
  -u, --uri             MQTT broker URI                      [string] [required]
  --vc, --video-codec   Codec name for video (SDP)
                      [string] [choices: "H264", "VP8", "VP9"] [default: "H264"]
  --help                Show help                                      [boolean]
```

# Usage

```bash
#!/usr/bin/env bash

ACCESS_TOKEN=foobar
BROKER_URI=ws://example.org/
CONFERENCE_APP_NAME=conference.example.org
CONFERENCE_ROOM_ID=ea3f9fd1-3356-43b4-b709-b7cfc563ea59
STUN_URL=stun:stun.example.org:3478
TELEMETRY_APP_NAME=telemetry.example.org
TURN_URL=turn:example.org:3478
TURN_USERNAME=username
TURN_PASSWORD=password

wrtc-agent \
  -c web.john-doe.example.org \
  -n ${CONFERENCE_APP_NAME} \
  -P ${ACCESS_TOKEN} \
  -r ${CONFERENCE_ROOM_ID} \
  --relay-only \
  --stun ${STUN_URL} \
  --telemetry ${TELEMETRY_APP_NAME} \
  --telemetry-interval 10000 \
  --turn ${TURN_URL} \
  --turn-username ${TURN_USERNAME} \
  --turn-password ${TURN_PASSWORD} \
  -u ${BROKER_URI}
```
