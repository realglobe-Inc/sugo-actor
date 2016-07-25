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
const Module = require('./module')
const WSEmitter = require('./emitting/ws_emitter')
const validatePerformConfig = require('./validating/validate_perform_config')
const { ReservedNames } = require('sugo-constants')

const { GreetingEvents, RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')
const { EventEmitter } = require('events')

const { OK, NG } = AcknowledgeStatus
const { HI, BYE } = GreetingEvents
const { SPEC, PERFORM } = RemoteEvents

let ok = (payload) => ({ status: OK, payload })
let ng = (payload) => ({ status: NG, payload: payload && payload.message || payload })

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
    return co(function * () {
      if (s.socket) {
        throw new Error('Already connected')
      }
      let socket = sgSocketClient(s.url)

      yield socket.waitToConnect()
      let hi = yield socket.call(HI, { key })
      {
        let { payload } = hi
        s.key = s.key || payload.key
      }

      for (let name of Object.keys(modules || {})) {
        let module = modules[ name ]
        let spec = module.$$describe()
        yield socket.call(SPEC, { name, spec })

        let pipe = new WSEmitter(socket, name, { key })
        module.$$registerEmitter(pipe)
        pipe.open()
        s.pipes.push(pipe)
      }

      socket.on(PERFORM, (data, callback) => co(function * () {
        let error = validatePerformConfig(data)
        if (error) {
          callback(ng(error))
        }
        let { method, params } = data
        let modulesName = data.module
        let module = modules[ modulesName ]
        if (!module) {
          callback(ng(new Error(`[SUGO-Actor] Invalid module: ${modulesName}`)))
          return
        }
        try {
          let result = yield module.$$invoke(method, params)
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
}

module.exports = SugoActor

/**
 * @typedef {Object<string,function>} SugoActorModuleConfig
 */
