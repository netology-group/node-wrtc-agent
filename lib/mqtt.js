const process = require('process')

const MQTTClient = require('@netology-group/mqtt-client').default
const Conference = require('@ulms/api-clients/lib/conference').default
const FetchHttpClient = require('@ulms/api-clients/lib/http-client').default
const HTTPConference = require('@ulms/api-clients/lib/http-conference').default

function createClient ({ agentLabel, appName, clientId, endpoint, password, uri }) {
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

    const provider = {
      getToken: () => Promise.resolve(password)
    }
    const conferenceClient = new Conference(mqttClient, clientId, appName)
    const httpConferenceClient = new HTTPConference(endpoint, new FetchHttpClient(), provider)

    httpConferenceClient.setHeaders({ 'X-Agent-Label': agentLabel })

    mqttClient.on(MQTTClient.events.CONNECT, () => {
      // console.log('[mqttClient] connected', clientId)

      resolve({ conferenceClient, httpConferenceClient, mqttClient })
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

module.exports = {
  createClient,
}
