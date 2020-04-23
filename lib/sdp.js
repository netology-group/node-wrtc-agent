/* eslint-disable */
const { parse, write } = require('sdp-transform')

function getPayloadByCodec (codec, rtp) {
  let payload = null
  let i

  for (i = 0; i < rtp.length; i++) {
    if (rtp[i].codec === codec) {
      payload = rtp[i].payload

      break
    }
  }

  return payload
}

function filterByPayload (payload) {
  return function (item) {
    return item.payload === payload
  }
}

function mapByPayload (payload) {
  return function (item) {
    item.payload = payload

    return item
  }
}

function transformOfferSDP (sdp) {
  const sdpParsed = parse(sdp)
  const config = {
    audio: {
      codecName: 'opus',
      modifiedPayload: 109,
    },
    video: {
      codecName: 'H264',
      modifiedPayload: 126,
    }
  }

  // console.debug('[sdp] opts', opts)
  // console.debug('[sdp] original', sdpParsed)

  sdpParsed.media.forEach(m => {
    if (m.type === 'audio' || m.type === 'video') {
      const originalPayload = getPayloadByCodec(config[m.type].codecName, m.rtp)

      console.debug(`[${config[m.type].codecName}] payload: ${originalPayload} --> ${config[m.type].modifiedPayload}`)

      m.rtp = m.rtp.filter(filterByPayload(originalPayload)).map(mapByPayload(config[m.type].modifiedPayload))
      m.fmtp = m.fmtp.filter(filterByPayload(originalPayload)).map(mapByPayload(config[m.type].modifiedPayload))

      if (m.rtcpFb) {
        m.rtcpFb = m.rtcpFb.filter(filterByPayload(originalPayload)).map(mapByPayload(config[m.type].modifiedPayload))
      }

      m.payloads = String(config[m.type].modifiedPayload)
      // m.bandwidth = [{type: 'AS', limit: '20'}]
    }
  })

  return write(sdpParsed)
}

module.exports = {
  transformOfferSDP
}
