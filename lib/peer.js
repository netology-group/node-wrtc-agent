const { RTCPeerConnection, RTCSessionDescription } = require('wrtc')

const { transformOfferSDP } = require('./sdp')

function logError (error) {
  console.log(error)
}

class Peer {
  constructor (config, candidateHandler, trackHandler) {
    const p = new RTCPeerConnection(config)

    function handleConnectionStateChangeEvent (event) {
      console.log('[PEER]', p.connectionState)
    }

    function handleICECandidateEvent (cb, event) {
      if (event.candidate) {
        cb(event.candidate)
      }
    }

    function handleICEConnectionStateChangeEvent (event) {
      console.log(`[ICE] connection state changed to: ${p.iceConnectionState}`)

      // switch (p.iceConnectionState) {
      //   case 'closed':
      //   case 'failed':
      //     break
      //
      //   case 'disconnected':
      //     //   closePeerConnection()
      //
      //     break
      //   default:
      //   // nothing
      // }
    }

    function handleICEGatheringStateChangeEvent (handler, event) {
      console.log(`ICE gathering state changed to: ${p.iceGatheringState}`)

      // switch (event.target.iceGatheringState) {
      switch (p.iceGatheringState) {
        case 'complete':
          handler({ completed: true })
          break
        default:
        // nothing
      }
    }

    function handleSignalingStateChangeEvent (event) {
      console.info(`[WebRTC] signaling state changed to: ${p.signalingState}`)

      // switch (p.signalingState) {
      //   case 'closed':
      //     // closePeerConnection()
      //
      //     break
      //   default:
      //   // nothing
      // }
    }

    function handleTrackEvent (cb, event) {
      cb(event.track, event.streams)
    }

    p.onconnectionstatechange = handleConnectionStateChangeEvent
    p.onicecandidate = handleICECandidateEvent.bind(null, candidateHandler)
    p.oniceconnectionstatechange = handleICEConnectionStateChangeEvent
    p.onicegatheringstatechange = handleICEGatheringStateChangeEvent.bind(null, candidateHandler)
    p.onsignalingstatechange = handleSignalingStateChangeEvent
    p.ontrack = handleTrackEvent.bind(null, trackHandler)

    this._peer = p
  }

  createOffer (offerOptions) {
    return this._peer
      .createOffer(offerOptions)
      .catch(logError)
  }

  setOffer (offer) {
    const desc = new RTCSessionDescription(offer)

    return this._peer
      .setLocalDescription(desc)
      .catch(logError)
  }

  setAnswer (answer) {
    const desc = new RTCSessionDescription(answer)

    return this._peer
      .setRemoteDescription(desc)
      .catch(logError)
  }

  close () {
    if (this._peer) {
      this._peer.onconnectionstatechange = null
      this._peer.onicecandidate = null
      this._peer.oniceconnectionstatechange = null
      this._peer.onicegatheringstatechange = null
      this._peer.onsignalingstatechange = null
      this._peer.ontrack = null

      this._peer.close()
    }
  }
}

function transformOffer (offer) {
  return {
    type: 'offer',
    sdp: transformOfferSDP(offer.sdp)
  }
}

module.exports = {
  Peer,
  transformOffer
}
