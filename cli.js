#!/usr/bin/env node

/* eslint-disable quote-props */
const { argv } = require('yargs')
  .scriptName('wrtc-agent')
  .options({
    'c': {
      alias: 'client-id',
      demandOption: true,
      description: 'Client id for mqtt-client',
      type: 'string'
    },
    'n': {
      alias: 'name',
      demandOption: true,
      description: 'Conference app name',
      type: 'string'
    },
    'P': {
      alias: 'password',
      demandOption: true,
      description: 'Password for mqtt-client',
      type: 'string'
    },
    'r': {
      alias: 'room-id',
      demandOption: true,
      description: 'Conference room id',
      type: 'string'
    },
    'relay-only': {
      description: 'Use only "relay" ICE candidates',
      type: 'boolean'
    },
    'stun': {
      demandOption: true,
      description: 'STUN server URL',
      type: 'string'
    },
    'telemetry': {
      description: 'Telemetry app name',
      type: 'string'
    },
    'telemetry-interval': {
      default: 5000,
      description: 'Telemetry interval (ms)',
      type: 'number'
    },
    'turn': {
      demandOption: true,
      description: 'TURN server URL',
      type: 'string'
    },
    'turn-password': {
      demandOption: true,
      description: 'TURN password',
      type: 'string'
    },
    'turn-username': {
      demandOption: true,
      description: 'TURN username',
      type: 'string'
    },
    'u': {
      alias: 'uri',
      demandOption: true,
      description: 'MQTT broker URI',
      type: 'string'
    },
    'vc': {
      alias: 'video-codec',
      choices: ['H264', 'VP8', 'VP9'],
      default: 'H264',
      description: 'Codec name for video (SDP)',
      type: 'string'
    }
  })
  .help()
/* eslint-enable quote-props */

const { createPeerStatsMonitor, stats2metrics } = require('./lib/metrics')
const { INTENT_READ, createClient, enterRoom, publishTelemetry, rejectByTimeout } = require('./lib/mqtt')
const { Peer, transformOffer } = require('./lib/peer')

// args
const {
  clientId,
  name: appName,
  password,
  roomId,
  relayOnly,
  stun,
  telemetry: telemetryAppName,
  telemetryInterval,
  turn,
  turnPassword,
  turnUsername,
  uri,
  videoCodec
} = argv

const REJECT_TIMEOUT = 5e3
const iceServers = [
  { urls: stun },
  {
    urls: turn,
    username: turnUsername,
    credential: turnPassword
  }
]
const iceTransportPolicy = relayOnly ? 'relay' : 'all'

let peer = null
let peerStats = null

function listRtcAll (client, roomId) {
  const LIST_LIMIT = 25
  let result = []
  let counter = 0

  function loop (room, offset, cb) {
    rejectByTimeout(client.listRtc(room, { offset }), REJECT_TIMEOUT)
      .then((response) => {
        if (response.length > 0) {
          counter += 1

          result = result.concat(response)

          if (response.length === LIST_LIMIT) {
            loop(room, counter * LIST_LIMIT, cb)
          } else {
            counter = 0

            cb()
          }
        } else {
          cb()
        }

        return null
      })
      .catch((error) => {
        cb(error)
      })
  }

  return new Promise((resolve, reject) => {
    loop(roomId, 0, (error) => {
      if (error) {
        reject(error)

        return
      }

      resolve(result)
    })
  })
}

function startListening (client, mqttClient) {
  const listenerOptions = { offerToReceiveVideo: true, offerToReceiveAudio: true }
  let resolveFn
  let rejectFn
  const peerReadyPromise = new Promise((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })

  peer = new Peer(
    { iceServers, iceTransportPolicy },
    candidateObj => {
      const { candidate, completed, sdpMid, sdpMLineIndex } = candidateObj

      rejectByTimeout(client.createTrickleSignal(roomId, completed ? candidateObj : {
        candidate,
        sdpMid,
        sdpMLineIndex
      }), REJECT_TIMEOUT)
        .catch(error => console.debug('[startListening:createTrickleSignal] error', error))
    },
    (iceConnectionState) => {
      if (iceConnectionState === 'connected' || iceConnectionState === 'completed') {
        resolveFn()
      } else if (iceConnectionState === 'failed' || iceConnectionState === 'closed') {
        rejectFn()
      }
    },
    (track, streams) => {
      console.debug('[track]', track.kind)
    }
  )

  if (telemetryAppName) {
    peerStats = createPeerStatsMonitor(peer._peer, telemetryInterval, (stats) => {
      const payload = stats2metrics(stats)

      publishTelemetry(mqttClient, clientId, telemetryAppName, payload)
    })
  }

  peer.createOffer(listenerOptions)
    .then((offer) => {
      const newOffer = transformOffer(offer, { videoCodec })

      return rejectByTimeout(client.createSignal(roomId, newOffer), REJECT_TIMEOUT)
        .then(response => ({ response, offer: newOffer }))
    })
    .then(({ response, offer }) => {
      return peer.setOffer(offer)
        .then(() => peer.setAnswer(response.jsep))
    })
    .catch(error => {
      console.debug('[startListening] error', error)

      rejectFn()
    })

  return peerReadyPromise
}

function connectToStream (client, rtcId) {
  rejectByTimeout(client.connectRtc(rtcId, { intent: INTENT_READ }), REJECT_TIMEOUT)
    .then((response) => console.log('[connectToStream:connectRtc] response', response))
    .catch(error => console.debug('[connectToStream:connectRtc] error', error))
}

function stopListening () {
  if (peer) {
    peer.close()

    peer = null
  }

  if (peerStats) {
    peerStats = null
  }
}

createClient({ appName, clientId, password, uri })
  .then(({ conferenceClient, mqttClient }) => {
    enterRoom(conferenceClient, roomId, clientId)
      .then(() => startListening(conferenceClient, mqttClient))
      .then(() => listRtcAll(conferenceClient, roomId))
      .then((response) => {
        console.log('[listRtcAll] response', response)

        if (response.length > 0) {
          connectToStream(conferenceClient, response[0].id)
        } else {
          console.warn('[listRtcAll] empty response')
        }
      })
      .catch(error => {
        console.log('error', error)

        stopListening()
      })
  })
