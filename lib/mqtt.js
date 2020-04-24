const process = require('process')

const MQTTClient = require('@netology-group/mqtt-client').default
const { Conference } = require('@ulms/api-clients')

function publishTelemetry (mqttClient, agentId, appName, payload) {
  const properties = {
    userProperties: {
      label: 'metric.create',
      local_timestamp: Date.now().toString(),
      type: 'event'
    }
  }

  if (mqttClient && mqttClient.connected && mqttClient._client && !mqttClient._client.disconnecting) {
    mqttClient.publish(`agents/${agentId}/api/v1/out/${appName}`, JSON.stringify(payload), { properties })
  }
}

function createClient ({ appName, clientId, password, uri }) {
  return new Promise((resolve, reject) => {
    const mqttClient = new MQTTClient(uri)

    mqttClient.connect({
      clientId,
      password,
      keepalive: 10,
      properties: {
        userProperties: {
          connection_mode: 'default',
          connection_version: 'v2'
        }
      },
      protocolVersion: 5,
      reconnectPeriod: 0,
      username: ''
    })

    const conferenceClient = new Conference(mqttClient, clientId, appName)

    mqttClient.on(MQTTClient.events.CONNECT, () => {
      console.log('[mqttClient] connected', clientId)

      resolve({ conferenceClient, mqttClient })
    })

    mqttClient.on(MQTTClient.events.CLOSE, (error) => {
      if (error) {
        console.error('[mqttClient] close error', error, error.toString())
      }

      console.log('[mqttClient] close')

      process.exit(1)
    })

    mqttClient.on(MQTTClient.events.ERROR, (error) => {
      console.log('[mqttClient] error', error.toString())
    })

    mqttClient.on(MQTTClient.events.RECONNECT, () => {
      console.log('[mqttClient] reconnect')
    })

    // mqttClient.on(MQTTClient.events.PACKETSEND, (packet) => {
    //   console.log(packet)
    // })

    mqttClient.on(MQTTClient.events.PACKETRECEIVE, (packet) => {
      if (packet && packet.reasonCode > 0) {
        console.debug(`[mqtt] Command '${packet.cmd}', reasonCode ${packet.reasonCode}`)
        console.debug(packet)
      }
    })

    return null
  })
}

function enterRoom (client, roomId, agentId) {
  return new Promise((resolve, reject) => {
    function enterEventHandler (event) {
      if (event.data.agent_id === agentId) {
        client.off('room.enter', enterEventHandler)

        resolve()
      }
    }

    client.on('room.enter', enterEventHandler)

    client.enterRoom(roomId)
      // .then(response => console.log('[enterRoom] response', response))
      // .catch(error => console.log('[enterRoom] error', error) || reject(error))
      .catch(reject)
  })
}

module.exports = {
  createClient,
  enterRoom,
  publishTelemetry
}
