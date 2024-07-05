const process = require('process')

const { MQTTClient, defaultOptions } = require('@ulms/api-clients/lib/mqtt')
const Broker = require('@ulms/api-clients/lib/broker').default
const FetchHttpClient = require('@ulms/api-clients/lib/http-client').default
const HTTPConference = require('@ulms/api-clients/lib/http-conference').default
const ULMS = require('@ulms/api-clients/lib/ulms').default

function createClient ({ agentLabel, clientId, endpoint, password, ulmsEndpoint, uri }) {
  return new Promise((resolve) => {
    const mqttClient = new MQTTClient(uri)

    mqttClient.connect({
      ...defaultOptions,
      clientId,
      password
    })

    const provider = {
      getToken: () => Promise.resolve(password)
    }
    const brokerClient = new Broker(mqttClient)
    const httpConferenceClient = new HTTPConference(endpoint, new FetchHttpClient(), provider)
    const ulmsClient = new ULMS(ulmsEndpoint, new FetchHttpClient(), provider)

    httpConferenceClient.setHeaders({ 'X-Agent-Label': agentLabel })

    mqttClient.on(MQTTClient.events.CONNECT, () => {
      // console.log('[mqttClient] connected', clientId)

      resolve({ brokerClient, httpConferenceClient, mqttClient, ulmsClient })
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
  createClient
}
