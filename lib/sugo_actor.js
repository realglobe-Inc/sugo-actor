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

const { ReservedEvents, AuthEvents, GreetingEvents, RemoteEvents } = require('sg-socket-constants')
const { EventEmitter } = require('events')

const { ERROR } = ReservedEvents
const { HI, BYE } = GreetingEvents
const { SPEC, PERFORM } = RemoteEvents
const { AUTHENTICATION, AUTHENTICATED, UNAUTHORIZED } = AuthEvents

const { ok, ng } = require('./emitting/message_formatter')

const formatUrl = require('url').format
const argx = require('argx')
const { get } = require('bwindow')
const { HubUrls } = require('sugo-constants')
const { parse, format } = require('sg-serializer')

let _connectQueue = sgQueue()

/** @lends SugoActor */
class SugoActor extends EventEmitter {
  constructor (url, config = {}) {
    let args = argx(arguments)

    url = args.shift('string')
    config = args.shift('object') || {}

    if (!url) {
      url = SugoActor.urlFromConfig(config)
    }

    super()
    const s = this
    s.url = url
    s.socket = null
    s.pipes = {}

    if (config.interfaces) {
      console.warn('`config.interfaces` is now deprecated. Use `config.modules` instead. ')
      config.modules = config.interfaces
      delete config.interfaces
    }

    let {
      key,
      auth = false,
      modules = {}
    } = config
    assert.ok(key, 'config.key is required')

    {
      let noModuleFound = Object.keys(modules).length === 0
      if (noModuleFound) {
        console.warn('[SUGO-Actor] Modules is empty. You should pass at lease one module')
      }
    }

    for (let reserved of ReservedNames.MODULE.split(',')) {
      if (module.hasOwnProperty(reserved)) {
        throw new Error(`You cannot use "${reserved}" as a module name since it is reserved.`)
      }
    }

    Object.assign(s, { key, auth })
    s.modules = Module.compose(modules)
    s.loadedModules = {}

    s.onError = (err) => s.emit(err) || Promise.reject(err)
  }

  /**
   * Connect to cloud
   * @returns {Promise}
   */
  connect () {
    const s = this
    let { key, auth, modules } = s
    let doConnect = () => co(function * () {
      if (s.socket) {
        throw new Error('Already connected')
      }
      yield asleep(0)
      let socket = s.socket = sgSocketClient(s.url)
      socket.on(ERROR, (err) => s.emit(ERROR, err))
      if (auth) {
        yield new Promise((resolve, reject) => {
          socket.emit(AUTHENTICATION, auth)
          socket.once(UNAUTHORIZED, (err) =>
            reject(new Error(`[SUGO-Actor] Authentication failed: ${err.message}`))
          )
          socket.once(AUTHENTICATED, () => resolve())
        })
      }
      yield socket.waitToConnect()

      let hi = yield socket.call(HI, { key })
      {
        let { payload } = hi
        s.key = s.key || payload.key
      }

      for (let name of Object.keys(modules || {})) {
        yield s.load(name, modules[ name ])
      }

      socket.on(PERFORM, (data, callback) => co(function * () {
        let { meta = {} } = data
        let { types } = meta
        if (types) {
          data = parse(data, types, {})
        }
        try {
          let result = yield s.perform(data)
          let isObject = typeof result === 'object'
          let { payload, meta: types } = isObject ? format(result) : { payload: result }
          let meta = { types }
          callback(ok(payload, meta))
        } catch (err) {
          callback(ng(err))
        }
      }))
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
    let { key, pipes, loadedModules } = s
    return co(function * () {
      let { socket } = s
      if (!socket) {
        return
      }

      for (let name of Object.keys(loadedModules || {})) {
        yield s.unload(name, loadedModules[ name ])
      }

      for (let name of Object.keys(pipes)) {
        let pipe = pipes[ name ]
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
    let { loadedModules } = s
    return co(function * () {
      let error = validatePerformConfig(data)
      if (error) {
        throw error
      }
      let {
        module: modulesName,
        method,
        params
      } = data
      let module = loadedModules[ modulesName ]
      if (!module) {
        throw new Error(`[SUGO-Actor] Module not loaded: ${modulesName}`)
      }
      return yield module.$$invoke(method, params)
    })
  }

  /**
   * Load a module
   * @param {string} name - Name of module
   * @param {Object} module - Module to load
   * @returns {Promise}
   */
  load (name, module) {
    const s = this
    let { key, socket } = s
    return co(function * () {
      let spec = module.$spec
      yield socket.call(SPEC, { name, spec })

      let pipe = new WSEmitter(socket, name, { key })
      module.$$registerEmitter(pipe)
      pipe.open()
      s.pipes[ name ] = pipe
      s.loadedModules[ name ] = module
    })
  }

  /**
   * Unload module with name
   * @param {string} name - Name of module
   * @returns {Promise}
   */
  unload (name) {
    const s = this
    let { key, socket, loadedModules } = s
    return co(function * () {
      let module = loadedModules[ name ]
      let spec = null
      yield socket.call(SPEC, { name, spec })

      let pipe = s.pipes[ name ]
      module.$$unregisterEmitter(pipe)
      pipe.close()
      delete s.pipes[ name ]
      delete s.loadedModules[ name ]
    })
  }

  static get connectQueue () {
    return _connectQueue
  }

  static urlFromConfig (config) {
    let {
      protocol = get('location.protocol') || 'http',
      host = undefined,
      port = get('location.port') || 80,
      hostname = get('location.hostname') || 'localhost',
      pathname = HubUrls.ACTOR_URL
    } = config
    return formatUrl({
      protocol,
      host,
      port,
      hostname,
      pathname
    })
  }
}

module.exports = SugoActor

/**
 * @typedef {Object<string,function>} SugoActorModuleConfig
 */
