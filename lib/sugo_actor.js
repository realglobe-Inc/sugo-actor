/**
 * @class SugoActor
 * @augments {SugoClient}
 * @param {string} url - Cloud server url
 * @param {object} config - Configurations
 * @param {string} config.key - Key of actor
 * @param {object} config.auth - Auth object
 * @param {object.<String, SugoActorModule>} config.modules - Modules to load.
 * @param {string} config.path - Socket.IO option.
 */
'use strict'

const { SugoClient } = require('sugo-client')
const sgSocketClient = require('sg-socket-client')
const co = require('co')
const assert = require('assert')
const asleep = require('asleep')
const Module = require('./module')

const sgQueue = require('sg-queue')
const { ReservedEvents, GreetingEvents, RemoteEvents } = require('sg-socket-constants')
const { ClientTypes, CallerEvents } = require('sugo-constants')

const { validatePerformConfig, validateModules } = require('./validating')
const { ERROR } = ReservedEvents
const { HI, BYE } = GreetingEvents
const { JOIN, LEAVE, SPEC, DESPEC, PERFORM, RESULT } = RemoteEvents
const { ACTOR } = ClientTypes
const { authorize } = require('sugo-client-auth')
const { parseActorUrl } = require('./parsing')

const { messageFormatter, ModulePipeEmitter, ActorPipeEmitter } = require('./emitting')
const { ok, ng } = messageFormatter
const argx = require('argx')
const { parse, format } = require('sg-serializer')

let _connectQueue = sgQueue()

/** @lends SugoActor */
class SugoActor extends SugoClient {
  constructor (url, config = {}) {
    let args = argx(arguments)

    url = args.shift('string')
    config = args.shift('object') || {}

    if (!url) {
      url = parseActorUrl(config)
    }

    super()
    const s = this
    s.url = url
    s.socket = null
    s.modulePipes = {}
    s.actorPipe = null

    if (config.interfaces) {
      console.warn('`config.interfaces` is now deprecated. Use `config.modules` instead. ')
      config.modules = config.interfaces
      delete config.interfaces
    }

    let {
      key,
      auth = false,
      multiplex = true,
      reconnection = true,
      path = '/socket.io',
      modules = {}
    } = config

    {
      let noModuleFound = Object.keys(modules).length === 0
      if (noModuleFound) {
        console.warn('[SUGO-Actor] config.modules is empty. You should pass at lease one module')
      }
    }

    {
      let modulesError = validateModules(modules)
      if (modulesError) {
        throw modulesError
      }
    }

    Object.assign(s, { key, auth, multiplex, reconnection, path })
    s.modules = Module.compose(modules)
    s.loadedModules = {}
    s.onError = (err) => s.emitLocally(err) || Promise.reject(err)
  }

  /**
   * Connect to hub.
   * By call this, actor share specification of the modules to hub so that callers can access them.
   * @returns {Promise}
   */
  connect () {
    const s = this
    let { key, auth, multiplex, reconnection, modules, url, path } = s

    assert.ok(key, '[SUGO-Actor] key is missing')

    let doConnect = () => co(function * () {
      if (s.socket) {
        throw new Error('Already connected')
      }
      yield asleep(0)
      let socket = s.socket = sgSocketClient(url, { multiplex, reconnection, path })
      socket.on(ERROR, (err) => {
        s.emitLocally(ERROR, err)
      })
      if (auth) {
        try {
          yield authorize(socket, auth)
        } catch (err) {
          throw new Error(
            `[SUGO-Actor] Authentication failed: ${err.message} ( url: ${JSON.stringify(url)}, auth: ${JSON.stringify(auth)} )`
          )
        }
      }
      yield socket.waitToConnect()

      s.actorPipe = new ActorPipeEmitter(socket, { key })
      s.actorPipe.open()

      let hi = yield socket.call(HI, { key })
      {
        let { payload } = hi
        s.key = s.key || payload.key
      }

      for (let name of Object.keys(modules || {})) {
        yield s.load(name, modules[ name ])
      }

      socket.on(JOIN, ({ caller, messages }) => {
        caller = s.asCallerInstance(caller)
        s.emitLocally(CallerEvents.JOIN, { caller, messages })
      })
      socket.on(LEAVE, ({ caller, messages }) => {
        caller = s.asCallerInstance(caller)
        s.emitLocally(CallerEvents.LEAVE, { caller, messages })
      })

      socket.on(PERFORM, (data) => co(function * () {
        let { meta = {}, pid } = data
        if (!pid) {
          throw new Error(`[SUGO-Actor] pid not found in PERFORM action. You need to use sugo-hub@6.x or later`)
        }
        let callback = (data) => (socket.emit(RESULT, Object.assign(data, { key, pid })))

        let { types } = meta
        if (types) {
          data = parse(data, types, {})
        }
        try {
          let result = yield s.perform(data)
          let isObject = typeof result === 'object' && result !== null
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
   * Disconnect from the hub
   * @returns {Promise}
   */
  disconnect () {
    const s = this
    let { key, actorPipe, modulePipes, loadedModules } = s
    return co(function * () {
      let { socket } = s
      if (!socket) {
        return
      }

      for (let name of Object.keys(loadedModules || {})) {
        yield s.unload(name)
      }

      for (let name of Object.keys(modulePipes)) {
        let modulePipe = modulePipes[ name ]
        modulePipe.close()
        delete modulePipes[ name ]
      }
      if (actorPipe) {
        actorPipe.close()
        s.actorPipe = null
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
   * @param {string} moduleName - Name of module
   * @param {Object} module - Module to load
   * @returns {Promise}
   */
  load (moduleName, module) {
    const s = this
    s.assertConnection()
    let isModule = Module.isModule(module)
    if (!isModule) {
      throw new Error(`[SUGO-Actor] Failed to load since it is not a module: ${moduleName}`)
    }
    let { key, socket } = s
    return co(function * () {
      {
        let { $$actor } = module
        if ($$actor) {
          throw new Error(
            `[SUGO-Actor] Module already loaded: "${moduleName}" to actor: ${$$actor.key}`
          )
        }
      }
      let spec = module.$spec
      yield socket.call(SPEC, { name: moduleName, spec, key })

      let modulePipe = new ModulePipeEmitter(socket, moduleName, { key })
      module.$$registerEmitter(modulePipe)
      module.$$actor = s
      modulePipe.open()
      s.modulePipes[ moduleName ] = modulePipe
      s.loadedModules[ moduleName ] = module

      // Load sub modules
      {
        for (let key of Object.keys(module)) {
          let val = module[ key ]
          if (Module.isModule(val)) {
            let hasEmitter = !!val.$emitter
            if (!hasEmitter) {
              yield s.loadSub(moduleName, { [key]: val })
            }
          }
        }
      }
    })
  }

  /**
   * Load sub modules
   * @param {string} moduleName
   * @param {Object} subModules
   * @returns {Promise}
   */
  loadSub (moduleName, subModules) {
    const s = this
    s.assertConnection()
    return co(function * () {
      subModules = Module.compose(subModules)
      for (let subModuleName of Object.keys(subModules)) {
        let fullName = [ moduleName, subModuleName ].join('.')
        yield s.load(fullName, subModules[ subModuleName ])
      }
    })
  }

  /**
   * Unload a module
   * @param {string} moduleName - Name of module
   * @returns {Promise}
   */
  unload (moduleName) {
    const s = this
    s.assertConnection()
    let { key, socket, loadedModules } = s
    return co(function * () {
      let module = loadedModules[ moduleName ]
      yield socket.call(DESPEC, { name: moduleName, key })
      let modulePipe = s.modulePipes[ moduleName ]
      module.$$unregisterEmitter(modulePipe)
      delete module.$$actor
      modulePipe.close()
      delete s.modulePipes[ moduleName ]
      delete s.loadedModules[ moduleName ]
    })
  }

  /**
   * Unload sub module
   * @param {string} moduleName - Name of module
   * @param {string[]} subModuleNames - Name of sub modules
   * @returns {*}
   */
  unloadSub (moduleName, subModuleNames) {
    const s = this
    return co(function * () {
      for (let subModuleName of subModuleNames) {
        yield s.unload([ moduleName, subModuleName ].join('.'))
      }
    })
  }

  emit (event, data, options = {}) {
    const s = this
    let { local = false, only = null } = options
    super.emit(event, data)
    if (!local) {
      s.emitToRemote(event, data, { only })
    }
  }

  emitLocally (event, data) {
    const s = this
    s.emit(event, data, { local: true })
  }

  emitToRemote (event, data, options = {}) {
    const s = this
    let { actorPipe } = s
    if (actorPipe) {
      actorPipe.emit(event, data, options)
    } else {
      console.warn('[SUGO-Actor] Not connected!')
    }
  }

  asCallerInstance (caller) {
    const s = this

    let only = [ caller.key ]
    let emit = (event, data) => s.emitToRemote(event, data, { only })
    return Object.assign({}, caller, { emit })
  }

  /**
   * Assert if the connected to hub
   * @throws {Error}
   */
  assertConnection () {
    const s = this
    assert.ok(s.socket, '[SUGO-Actor] Not connected!')
  }

  /** @override */
  get clientType () {
    return ACTOR
  }

  /** @deprecated */
  static urlFromConfig () {
    console.warn('`SugoActor.urlFromConfig` is now deprecated. Use `SugoActor.parseActorUrl` instead')
    return this.parseActorUrl(...arguments)
  }

  /**
   * Parse actor url
   */
  static parseActorUrl () {
    return parseActorUrl(...arguments)
  }

  static get connectQueue () {
    return _connectQueue
  }
}

module.exports = SugoActor
