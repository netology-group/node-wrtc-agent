const { WebRTCStats } = require('@peermetrics/webrtc-stats')
const { snakeCase } = require('change-case')
const { v4 } = require('uuid')
const wrtc = require('wrtc')

function stats2metrics (stats) {
  // const localAudioMetricList = [
  //   'packetsSent',
  //   'retransmittedPacketsSent',
  //   'bytesSent',
  //   'headerBytesSent',
  //   'retransmittedBytesSent',
  //   'bitrate',
  //   'packetRate'
  // ]
  const remoteAudioMetricList = [
    // 'packetsReceived',
    // 'bytesReceived',
    // 'headerBytesReceived',
    'packetsLost',
    // 'jitter',
    // 'jitterBufferDelay',
    // 'jitterBufferEmittedCount',
    // 'audioLevel',
    // 'totalAudioEnergy',
    // 'totalSamplesReceived',
    // 'totalSamplesDuration',
    'bitrate',
    // 'packetRate'
  ]
  // const localVideoMetricList = [
  //   'firCount',
  //   'pliCount',
  //   'nackCount',
  //   'qpSum',
  //   'packetsSent',
  //   'retransmittedPacketsSent',
  //   'bytesSent',
  //   'headerBytesSent',
  //   'retransmittedBytesSent',
  //   'framesEncoded',
  //   'keyFramesEncoded',
  //   'totalEncodeTime',
  //   'totalEncodedBytesTarget',
  //   'totalPacketSendDelay',
  //   'qualityLimitationReason',
  //   'qualityLimitationResolutionChanges',
  //   'frameWidth',
  //   'frameHeight',
  //   'framesSent',
  //   'hugeFramesSent',
  //   'bitrate',
  //   'packetRate'
  // ]
  const remoteVideoMetricList = [
    // 'firCount',
    // 'pliCount',
    // 'nackCount',
    // 'qpSum',
    // 'packetsReceived',
    // 'bytesReceived',
    // 'headerBytesReceived',
    'packetsLost',
    // 'framesDecoded',
    // 'keyFramesDecoded',
    // 'totalDecodeTime',
    // 'totalInterFrameDelay',
    // 'totalSquaredInterFrameDelay',
    // 'jitterBufferDelay',
    // 'jitterBufferEmittedCount',
    // 'frameWidth',
    // 'frameHeight',
    // 'framesReceived',
    // 'framesDropped',
    'bitrate',
    // 'packetRate'
  ]
  // const candidateLocalMetricList = [
  //   'candidateType',
  //   'networkType',
  //   'protocol',
  // ]
  // const candidateRemoteMetricList = [
  //   'candidateType',
  //   'protocol',
  // ]
  // const connectionMetricList = [
  //   // 'bytesSent',
  //   // 'bytesReceived',
  //   'totalRoundTripTime',
  //   'currentRoundTripTime',
  //   'availableOutgoingBitrate'
  // ]
  const tags = {
    peer_id: stats.peerId,
  }

  // const metricBaseName = 'apps.wrtc-agent.pc'
  const metricBaseName = ''
  // const localAudioMetricName = `${metricBaseName}.audio.local`
  // const localAudioMetrics = localAudioMetricList.map(_ => ({
  //   metric: `${localAudioMetricName}.${snakeCase(_)}`,
  //   value: stats.data.audio.local[_] || 0
  // }))
  const remoteAudioMetricName = `${metricBaseName}.audio.remote`
  const remoteAudioMetrics = remoteAudioMetricList.map(_ => ({
    metric: `${remoteAudioMetricName}.${snakeCase(_)}`,
    value: stats.data.audio.remote[_] || 0,
    tags
  }))
  // const localVideoMetricName = `${metricBaseName}.video.local`
  // const localVideoMetrics = localVideoMetricList.map(_ => ({
  //   metric: `${localVideoMetricName}.${snakeCase(_)}`,
  //   value: stats.data.video.local[_] || 0
  // }))
  const remoteVideoMetricName = `${metricBaseName}.video.remote`
  const remoteVideoMetrics = remoteVideoMetricList.map(_ => ({
    metric: `${remoteVideoMetricName}.${snakeCase(_)}`,
    value: stats.data.video.remote[_] || 0,
    tags
  }))
  // const connectionMetricName = `${metricBaseName}.connection`
  // const connectionMetrics = connectionMetricList.map(_ => ({
  //   metric: `${connectionMetricName}.${snakeCase(_)}`,
  //   value: stats.data.connection[_] || 0,
  //   tags
  // }))
  // const candidateLocalMetricName = `${metricBaseName}.connection.local`
  // const candidateLocalMetrics = candidateLocalMetricList.map(_ => ({
  //   metric: `${candidateLocalMetricName}.${snakeCase(_)}`,
  //   value: stats.data.connection.local[_] || 0,
  //   tags,
  // }))
  // const candidateRemoteMetricName = `${metricBaseName}.connection.remote`
  // const candidateRemoteMetrics = candidateRemoteMetricList.map(_ => ({
  //   metric: `${candidateRemoteMetricName}.${snakeCase(_)}`,
  //   value: stats.data.connection.remote[_] || 0,
  //   tags,
  // }))

  return [
    // ...localAudioMetrics,
    ...remoteAudioMetrics,
    // ...localVideoMetrics,
    ...remoteVideoMetrics,
    // ...connectionMetrics,
    // ...candidateLocalMetrics,
    // ...candidateRemoteMetrics
  ]
}

function createPeerStatsMonitor (peer, interval, statsHandler) {
  const p = new WebRTCStats({
    getStatsInterval: interval,
    wrtc
  })

  p.on('stats', statsHandler)

  p.addPeer({
    pc: peer,
    peerId: v4()
  })

  return p
}

module.exports = {
  createPeerStatsMonitor,
  stats2metrics
}
