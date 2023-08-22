#!/usr/bin/env node

/* eslint-disable quote-props */
require('regenerator-runtime/runtime')

const crypto = require('crypto')
const WebSocket = require('ws').WebSocket
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc')

const { argv } = require('yargs')
  .scriptName('jt')
  .options({
    'r': {
      alias: 'room-id',
      demandOption: true,
      description: 'Room id',
      type: 'number'
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
      description: 'WS uri',
      type: 'string'
    },
  })
  .help()
/* eslint-enable quote-props */

// args
const {
  roomId,
  relayOnly,
  stun,
  turn,
  turnPassword,
  turnUsername,
  uri,
} = argv


const uuid = () => crypto.randomUUID()

function createTransport (url) {
  let resolveFn
  let rejectFn
  const openedPromise = new Promise((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })
  const requestMap = {}
  const ws = new WebSocket(url, 'janus-protocol')
  const send = (data) => {
    const transaction = uuid()
    const payload = {
      ...data,
      transaction,
    }

    ws.send(JSON.stringify(payload))

    return new Promise((resolve, reject) => {
      requestMap[transaction] = {
        resolve,
        reject
      }
    })
  }

  ws.addEventListener('close', console.log)
  ws.addEventListener('error', console.log)
  ws.addEventListener('message', (messageEvent) => {
    const data = JSON.parse(messageEvent.data)

    if (data.janus) {
      if (data.janus !== 'ack' && data.janus !== 'event' && data.janus !== 'success') {
        console.log(`[${data.janus}]`)
      }
    } else {
      console.log('[message]', data)
    }

    if (data.transaction && requestMap[data.transaction] && data.janus !== 'ack') {
      const requestData = requestMap[data.transaction]

      delete requestMap[data.transaction]

      requestData.resolve(data)
    }
  })
  ws.addEventListener('open', () => {
    resolveFn({ send, ws })
  })

  return openedPromise
}

const iceServers = [
  { urls: stun },
  {
    urls: turn,
    username: turnUsername,
    credential: turnPassword
  }
]
const iceTransportPolicy = relayOnly ? 'relay' : 'all'

let handleId
let sessionId
let serverTimeoutId

createTransport(uri)
  .then(async (transport) => {
    const createResponse = await transport.send({ janus: 'create' })

    // console.log('[create] response', createResponse)

    sessionId = createResponse.data.id

    // send keepalive message
    serverTimeoutId = setInterval(() => {
      transport.ws.send(JSON.stringify({
        janus: 'keepalive',
        session_id: sessionId,
        transaction: uuid()
      }))
    }, 50 * 1000)

    const attachResponse = await transport.send({
      janus: 'attach',
      plugin: 'janus.plugin.videoroom',
      session_id: sessionId,
    })

    // console.log('[attach] response', attachResponse)

    handleId = attachResponse.data.id

    const listResponse = await transport.send({
      janus: 'message',
      body: {
        request : 'listparticipants',
        room: roomId
      },
      session_id: sessionId,
      handle_id: handleId
    })

    // console.log('[listResponse]', listResponse)

    const { participants } = listResponse.plugindata.data
    const publisherId = participants.length > 0 ? participants[0].id : null

    if (!publisherId) {
      console.warn('[participants] empty list, no publisher')

      return
    }

    const payload = {
      janus: 'message',
      body: {
        request: 'join',
        ptype: 'subscriber',
        room: roomId,
        feed: publisherId,
      },
      session_id: sessionId,
      handle_id: handleId
    }

    const joinResponse = await transport.send(payload)

    // console.log('[join] response', joinResponse)

    const peer = new RTCPeerConnection({ iceServers, iceTransportPolicy })

    peer.addEventListener('icecandidate', (event) => {
      const candidatePayload = {
        candidate: event.candidate || { completed: true},
        handle_id: handleId,
        janus: 'trickle',
        session_id: sessionId,
      }

      transport.send(candidatePayload)
    })

    peer.addEventListener('track', (event) => {
      console.log('[track] event', event.track)
    })

    await peer.setRemoteDescription(new RTCSessionDescription(joinResponse.jsep))

    const answer = await peer.createAnswer()

    await peer.setLocalDescription(answer)

    const startResponse = await transport.send({
      janus: 'message',
      jsep: answer,
      body: {
        request: 'start',
      },
      session_id: sessionId,
      handle_id: handleId
    })

    // console.log('[start] response', startResponse)
  })
  .catch((error) => console.log('[ERROR]', error))
