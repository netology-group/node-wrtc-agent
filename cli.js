#!/usr/bin/env node

/* eslint-disable quote-props */
require('isomorphic-fetch')
require('regenerator-runtime/runtime')

const debounce = require('lodash/debounce')

const { argv } = require('yargs')
  .scriptName('wrtc-agent')
  .options({
    'c': {
      alias: 'client-id',
      demandOption: true,
      description: 'Client id for mqtt-client',
      type: 'string'
    },
    'classroom-id': {
      demandOption: true,
      description: 'ULMS classroom id',
      type: 'string'
    },
    'e': {
      alias: 'endpoint',
      demandOption: true,
      description: 'HTTP API endpoint for Conference client',
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
    'ulms': {
      demandOption: true,
      description: 'HTTP API endpoint for ULMS client',
      type: 'string'
    },
    'vc': {
      alias: 'video-codec',
      choices: ['VP8', 'VP9'],
      default: 'VP8',
      description: 'Codec name for video (SDP)',
      type: 'string'
    }
  })
  .help()
/* eslint-enable quote-props */

const { createClient } = require('./lib/mqtt')
const { Peer, transformOffer } = require('./lib/peer')

// args
const {
  classroomId,
  clientId,
  endpoint,
  password,
  roomId,
  relayOnly,
  stun,
  turn,
  turnPassword,
  turnUsername,
  uri,
  ulms: ulmsEndpoint,
  videoCodec
} = argv

const agentLabel = clientId.split('.')[0]
const iceServers = [
  { urls: stun },
  {
    urls: turn,
    username: turnUsername,
    credential: turnPassword
  }
]
const iceTransportPolicy = relayOnly ? 'relay' : 'all'

let activeRtcStream = null
let peer = null

function listRtcStreamAll (client, roomId) {
  const LIST_LIMIT = 25
  const now = Math.round(Date.now() / 1000)
  let result = []
  let counter = 0

  function loop (room, offset, cb) {
    client.listRtcStream(room, { offset, time: [now, null] })
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

function startListening (client, mqttClient, activeRtcStream, agentLabel) {
  const activeRtcId = activeRtcStream.rtc_id
  const listenerOptions = { offerToReceiveVideo: true, offerToReceiveAudio: true }

  let handleId = null
  let signalList = []

  function sendSignals (errorCallback) {
    if (!signalList.length) {
      return
    }

    const signals = signalList.slice()

    signalList = []

    client.createTrickleSignal(handleId, signals)
      .catch(errorCallback)
  }

  const debouncedSendSignals = debounce(sendSignals.bind(null, (error) => {
    console.log('[sendSignals] error', error)
  }), 300)

  peer = new Peer(
    { iceServers, iceTransportPolicy },
    candidateObj => {
      const { candidate, completed, sdpMid, sdpMLineIndex } = candidateObj

      signalList.push(completed ? candidateObj : { candidate, sdpMid, sdpMLineIndex })

      debouncedSendSignals()
    },
    (track) => {
      console.debug('[track]', track.kind)
    }
  )

  peer.createOffer(listenerOptions)
    .then(offer => {
      const newOffer = transformOffer(offer, { videoCodec })

      return client.createSignal(activeRtcId, newOffer)
        .then((response) => {
          handleId = response.handle_id

          return { response, offer: newOffer }
        })
    })
    .then(({ response, offer }) => peer.setOffer(offer).then(() => peer.setAnswer(response.jsep)))
    .catch(error => console.debug('[startListening] error', error))
}

function stopListening () {
  if (peer) {
    peer.close()

    peer = null
  }
}

createClient({ agentLabel, clientId, endpoint, password, ulmsEndpoint, uri })
  .then(({ brokerClient, httpConferenceClient, mqttClient, ulmsClient }) => {
    function isStreamActive (stream) {
      const { time } = stream

      return Boolean(time && time.length > 0 && time[0] !== null && time[1] === null)
    }

    function isStreamEnded (stream) {
      const { time } = stream

      return Boolean(time && time.length > 0 && time[0] !== null && time[1] !== null)
    }

    function handleStream (stream) {
      if (!activeRtcStream && isStreamActive(stream)) {
        activeRtcStream = stream

        startListening(httpConferenceClient, mqttClient, activeRtcStream, agentLabel)
      } else if (activeRtcStream && stream && activeRtcStream.id === stream.id && isStreamEnded(stream)) {
        activeRtcStream = null

        stopListening()
      } else {
        // do nothing
      }
    }

    brokerClient.on('rtc_stream.update', (event) => {
      const { id, rtc_id, sent_by, time } = event.data // eslint-disable-line camelcase

      console.group(`[event:${event.type}]`)
      console.log('[id]', id)
      console.log('[rtc_id]', rtc_id)
      console.log('[sent_by]', sent_by)
      console.log('[time]', time)
      console.groupEnd()

      handleStream(event.data)
    })

    ulmsClient.enterClassroom(classroomId, agentLabel)
      .then(() => {
        console.log('[READY]')

        listRtcStreamAll(httpConferenceClient, roomId)
          .then((response) => {
            if (response.length > 0 && isStreamActive(response[0])) {
              handleStream(response[0])
            }
          })
          .catch(error => console.log('[listRtcStreamAll] error', error))
      })
      .catch(error => console.log('[enterRoom] error', error))
  })
