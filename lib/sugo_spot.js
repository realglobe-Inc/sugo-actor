/**
 * @class SugoSpot
 * @param {string} url
 * @param {string}
 */
'use strict'

const sgSocketClient = require('sg-socket-client')
const co = require('co')
const assert = require('assert')
const SpotInterface = require('./helpers/spot_interface')
const { GreetingEvents, RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')
const { EventEmitter } = require('events')

const { OK, NG } = AcknowledgeStatus
const { HI, BYE } = GreetingEvents
const { INTERFACE, ACTION, PIPE } = RemoteEvents

let ok = (payload) => ({ status: OK, payload })
let ng = (payload) => ({ status: NG, payload })

let noop = () => undefined

/** @lends SugoSpot */
class SugoSpot extends EventEmitter {
  constructor (url, config = {}) {
    super()
    const s = this
    s.url = url
    s.socket = null

    let { key, token, interfaces } = config
    assert.ok(key, 'config.key is required')

    Object.assign(s, { key, token })
    s.interfaces = SpotInterface.compose(interfaces)

    s.onError = (err) => s.emit(err) || Promise.reject(err)
  }

  /**
   * Connect to cloud
   * @returns {Promise}
   */
  connect () {
    const s = this
    let { key, token, interfaces } = s
    return co(function * () {
      if (s.socket) {
        throw new Error('Already connected')
      }
      let socket = sgSocketClient(s.url)

      yield socket.waitToConnect()
      yield socket.call(HI, { key, token })

      for (let name of Object.keys(interfaces)) {
        let interface_ = interfaces[ name ]
        let spec = interface_.describe()
        yield socket.call(INTERFACE, { name, spec })
      }
      socket.on(ACTION, (data, callback) => co(function * () {
        let { target, name, params } = data
        let interfaceName = data.interface
        let interface_ = interfaces[ interfaceName ]
        if (!interface_) {
          callback(ng(new Error(`Invalid interface: ${target}`)))
        }
        let pipe = socket.wrap(`${PIPE}/${interfaceName}`)
        try {
          let result = yield interface_.invoke({ name, params, pipe })
          callback(ok(result))
        } catch (err) {
          callback(ng(err))
        }
      }))

      s.socket = socket
    }).catch(s.onError)
  }

  /**
   * Disconnect from the cloud
   * @returns {*|Promise}
   */
  disconnect () {
    const s = this
    let { key, token } = s
    return co(function * () {
      let { socket } = s
      if (!socket) {
        return
      }

      yield socket.call(BYE, { key, token })

      socket.close()

      yield socket.untilDisconnect()

      s.socket = null
    }).catch(s.onError)
  }

}

module.exports = SugoSpot
