/**
 * @class SugoSpot
 * @param {string} url
 * @param {string}
 */
'use strict'

const sgSocketClient = require('sg-socket-client')
const co = require('co')
const assert = require('assert')
const { SpotEvents } = require('sg-socket-constants')
const { EventEmitter } = require('events')

/** @lends SugoSpot */
class SugoSpot extends EventEmitter {
  constructor (url, config = {}) {
    super()
    const s = this
    s.url = url
    s.socket = null

    let { key, token, interfaces } = config
    assert.ok(key, 'config.key is required')

    Object.assign(s, { key, token, interfaces })

    s.onError = (err) => s.emit(err) || Promise.reject(err)
  }

  /**
   * Connect to cloud
   * @returns {Promise}
   */
  connect () {
    const s = this
    let { key, token } = s
    return co(function * () {
      if (s.socket) {
        throw new Error('Already connected')
      }
      let socket = sgSocketClient(s.url)

      // Say hi
      {
        const { HI, REJECTION } = SpotEvents
        yield socket.call(HI, { key, token }, {
          expect: HI,
          abort: REJECTION
        })
      }

      // Send interface
      {
        const { INTERFACE } = SpotEvents
        socket.emit(INTERFACE, {})
      }

      s.socket = socket
    }).catch(s.onError)
  }

  /**
   * Disconnect from the cloud
   * @returns {*|Promise}
   */
  disconnect () {
    const { BYE, REJECTION } = SpotEvents
    const s = this
    let { key, token } = s
    return co(function * () {
      let { socket } = s
      if (!socket) {
        return
      }
      yield new Promise((resolve, reject) => {
        socket.once(BYE, () => resolve())
        socket.emit(BYE, { key, token })
      })
      socket.off(BYE)
      socket.off(REJECTION)
      socket.close()
      s.socket = null
    }).catch(s.onError)
  }

}

module.exports = SugoSpot
