/**
 * @class SugoActor
 * @param {string} url - Cloud server url
 * @param {object} config - Configurations
 * @param {object.<String,SugoActorModuleConfig>} config.modules - Modules to load.
 */
'use strict'

const sgSocketClient = require('sg-socket-client')
const co = require('co')
const assert = require('assert')
const asleep = require('asleep')
const Module = require('./module')
const sgQueue = require('sg-queue')
const WSEmitter = require('./emitting/ws_emitter')
const validatePerformConfig = require('./validating/validate_perform_config')
const { ReservedNames } = require('sugo-constants')

const { GreetingEvents, RemoteEvents } = require('sg-socket-constants')
const { EventEmitter } = require('events')

const { HI, BYE } = GreetingEvents
const { SPEC, PERFORM } = RemoteEvents

const { ok, ng } = require('./emitting/message_formatter')

let _connectQueue = sgQueue()

/** @lends SugoActor */
class SugoActor extends EventEmitter {
  constructor (url, config = {}) {
    super()
    const s = this
    s.url = url
    s.socket = null
    s.pipes = []

    if (config.interfaces) {
      console.warn('`config.interfaces` is now deprecated. Use `config.modules` instead. ')
      config.modules = config.interfaces
      delete config.interfaces
    }

    let { key, modules } = config
    assert.ok(key, 'config.key is required')

    for (let reserved of ReservedNames.MODULE.split(',')) {
      if (module.hasOwnProperty(reserved)) {
        throw new Error(`You cannot use "${reserved}" as a module name since it is reserved.`)
      }
    }

    Object.assign(s, { key })
    s.modules = Module.compose(modules)

    s.onError = (err) => s.emit(err) || Promise.reject(err)
  }

  /**
   * Connect to cloud
   * @returns {Promise}
   */
  connect () {
    const s = this
    let { validator, key, modules } = s
    let doConnect = () => co(function * () {
      if (s.socket) {
        throw new Error('Already connected')
      }
      yield asleep(0)
      let socket = sgSocketClient(s.url)

      yield socket.waitToConnect()
      let hi = yield socket.call(HI, { key })
      {
        let { payload } = hi
        s.key = s.key || payload.key
      }

      for (let name of Object.keys(modules || {})) {
        let module = modules[ name ]
        let spec = module.$spec
        yield socket.call(SPEC, { name, spec })

        let pipe = new WSEmitter(socket, name, { key })
        module.$$registerEmitter(pipe)
        pipe.open()
        s.pipes.push(pipe)
      }

      socket.on(PERFORM, (data, callback) => co(function * () {
        try {
          let result = yield s.perform(data)
          callback(ok(result))
        } catch (err) {
          callback(ng(err))
        }
      }))
      s.socket = socket
    }).catch(s.onError)

    let { connectQueue } = SugoActor
    return connectQueue.push(doConnect)
  }

  /**
   * Disconnect from the cloud
   * @returns {*|Promise}
   */
  disconnect () {
    const s = this
    let { key, pipes } = s
    return co(function * () {
      let { socket, modules } = s
      if (!socket) {
        return
      }

      for (let pipe of pipes) {
        pipe.close()
      }

      yield socket.call(BYE, { key })
      socket.off(PERFORM)
      socket.close()

      yield socket.waitToDisconnect()

      s.socket = null
    }).catch(s.onError)
  }

  /**
   * Handle perform event
   * @param {object} data
   * @returns {Promise}
   */
  perform (data) {
    const s = this
    let { modules } = s
    return co(function * () {
      let error = validatePerformConfig(data)
      if (error) {
        throw error
      }
      let { method, params } = data
      let modulesName = data.module
      let module = modules[ modulesName ]
      if (!module) {
        throw new Error(`[SUGO-Actor] Module not found: ${modulesName}`)
      }
      return yield module.$$invoke(method, params)
    })
  }

  static get connectQueue () {
    return _connectQueue
  }
}

module.exports = SugoActor

/**
 * @typedef {Object<string,function>} SugoActorModuleConfig
 */
