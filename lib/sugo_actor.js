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

const {SugoClient} = require('sugo-client')
const sgSocketClient = require('sg-socket-client')
const assert = require('assert')
const asleep = require('asleep')
const Module = require('./module')

const sgQueue = require('sg-queue')
const {ReservedEvents, GreetingEvents, RemoteEvents} = require('sg-socket-constants')
const {ClientTypes, CallerEvents, HubNotices} = require('sugo-constants')
const {CALLER_GONE} = HubNotices

const {validatePerformConfig, validateModules} = require('./validating')
const {ERROR} = ReservedEvents
const {HI, BYE} = GreetingEvents
const {JOIN, LEAVE, SPEC, DESPEC, PERFORM, RESULT, NOTICE} = RemoteEvents
const {ACTOR} = ClientTypes
const {authorize} = require('sugo-client-auth')
const {parseActorUrl} = require('./parsing')

const {messageFormatter, ModulePipeEmitter, ActorPipeEmitter} = require('./emitting')
const {ok, ng} = messageFormatter
const argx = require('argx')
const {parse, format} = require('sg-serializer')
const debug = require('debug')('sg:actor')

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
    this.url = url
    this.socket = null
    this.modulePipes = {}
    this.actorPipe = null

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

    Object.assign(this, {key, auth, multiplex, reconnection, path})
    this.modules = Module.compose(modules)
    this.loadedModules = {}
    this.onError = (err) => this.emitLocally(err) || Promise.reject(err)
  }

  /**
   * Connect to hub.
   * By call this, actor share specification of the modules to hub so that callers can access them.
   * @returns {Promise}
   */
  async connect () {
    let {key, auth, multiplex, reconnection, modules, url, path} = this

    assert.ok(key, '[SUGO-Actor] key is missing')

    const doConnect = async () => {
      if (this.socket) {
        throw new Error('Already connected')
      }
      await asleep(0)
      const isBrowser = typeof window !== 'undefined'
      const socket = this.socket = sgSocketClient(url, {
        multiplex,
        reconnection,
        path,
        transports: isBrowser ? ['polling', 'websocket'] : ['websocket'],
      })
      socket.on(ERROR, (err) => {
        this.emitLocally(ERROR, err)
      })
      if (auth) {
        try {
          await authorize(socket, auth)
        } catch (err) {
          throw new Error(
            `[SUGO-Actor] Authentication failed: ${err.message} ( url: ${JSON.stringify(url)}, auth: ${JSON.stringify(auth)} )`
          )
        }
      }
      await socket.waitToConnect()

      this.actorPipe = new ActorPipeEmitter(socket, {key})
      this.actorPipe.open()

      let hi = await socket.call(HI, {key})
      {
        let {payload} = hi
        this.key = this.key || payload.key
      }

      for (let name of Object.keys(modules || {})) {
        await this.load(name, modules[name])
      }

      socket.on(JOIN, (data) => {
        const {caller, messages} = data || {}
        debug('Caller joined', caller)
        this.emitLocally(CallerEvents.JOIN, {
          caller: this.asCallerInstance(caller),
          messages
        })
      })
      socket.on(LEAVE, (data) => {
        const {caller, messages} = data
        debug('Caller left', caller)
        this.emitLocally(CallerEvents.LEAVE, {
          caller: this.asCallerInstance(caller),
          messages
        })
      })
      socket.on(NOTICE, ({name, data}) => {
        switch (name) {
          case CALLER_GONE: {
            const caller = this.asCallerInstance({key: data.key})
            debug('Caller gone', caller)
            this.emitLocally(CallerEvents.LEAVE, {caller})
            break
          }
          default: {
            break
          }
        }
      })

      socket.on(PERFORM, async (data) => {
        const {meta = {}, pid} = data
        if (!pid) {
          throw new Error(`[SUGO-Actor] pid not found in PERFORM action. You need to use sugo-hub@6.x or later`)
        }
        const callback = (data) => (socket.emit(RESULT, Object.assign(data, {key, pid})))

        let {types} = meta
        if (types) {
          data = parse(data, types, {})
        }
        try {
          let result = await
            this.perform(data)
          let isObject = typeof result === 'object' && result !== null
          let {payload, meta: types} = isObject ? format(result) : {payload: result}
          let meta = {types}
          callback(ok(payload, meta))
        } catch (err) {
          callback(ng(err))
        }
      })
    }

    let {connectQueue} = SugoActor
    return connectQueue.push(doConnect)
  }

  /**
   * Disconnect from the hub
   * @returns {Promise}
   */
  async disconnect () {
    const {key, actorPipe, modulePipes, loadedModules} = this
    const {socket} = this
    if (!socket) {
      return
    }

    for (const name of Object.keys(loadedModules || {})) {
      await this.unload(name)
    }

    for (const name of Object.keys(modulePipes)) {
      const modulePipe = modulePipes[name]
      modulePipe.close()
      delete modulePipes[name]
    }
    if (actorPipe) {
      actorPipe.close()
      this.actorPipe = null
    }

    await socket.call(BYE, {key})
    socket.off(PERFORM)
    socket.close()

    await socket.waitToDisconnect()

    this.socket = null
  }

  /**
   * Handle perform event
   * @param {object} data
   * @returns {Promise}
   */
  async perform (data) {
    const {loadedModules} = this
    const error = validatePerformConfig(data)
    if (error) {
      throw error
    }
    const {
      module: modulesName,
      method,
      params
    } = data
    const module = loadedModules[modulesName]
    if (!module) {
      throw new Error(`[SUGO-Actor] Module not loaded: ${modulesName}`)
    }
    return module.$$invoke(method, params)
  }

  /**
   * Load a module
   * @param {string} moduleName - Name of module
   * @param {Object} module - Module to load
   * @returns {Promise}
   */
  async load (moduleName, module) {
    this.assertConnection()
    let isModule = Module.isModule(module)
    if (!isModule) {
      throw new Error(`[SUGO-Actor] Failed to load since it is not a module: ${moduleName}`)
    }
    const {key, socket} = this
    {
      let {$$actor} = module
      if ($$actor) {
        throw new Error(
          `[SUGO-Actor] Module already loaded: "${moduleName}" to actor: ${$$actor.key}`
        )
      }
    }
    const spec = module.$spec
    await socket.call(SPEC, {name: moduleName, spec, key})

    const modulePipe = new ModulePipeEmitter(socket, moduleName, {key})
    module.$$registerEmitter(modulePipe)
    module.$$actor = this
    modulePipe.open()
    this.modulePipes[moduleName] = modulePipe
    this.loadedModules[moduleName] = module

    // Load sub modules
    {
      for (const key of Object.keys(module)) {
        const val = module[key]
        if (Module.isModule(val)) {
          let hasEmitter = !!val.$emitter
          if (!hasEmitter) {
            await this.loadSub(moduleName, {[key]: val})
          }
        }
      }
    }
  }

  /**
   * Load sub modules
   * @param {string} moduleName
   * @param {Object} subModules
   * @returns {Promise}
   */
  async loadSub (moduleName, subModules) {
    this.assertConnection()
    subModules = Module.compose(subModules)
    for (const subModuleName of Object.keys(subModules)) {
      const fullName = [moduleName, subModuleName].join('.')
      await this.load(fullName, subModules[subModuleName])
    }
  }

  /**
   * Unload a module
   * @param {string} moduleName - Name of module
   * @returns {Promise}
   */
  async unload (moduleName) {
    this.assertConnection()
    const {key, socket, loadedModules} = this
    const module = loadedModules[moduleName]
    await socket.call(DESPEC, {name: moduleName, key})
    const modulePipe = this.modulePipes[moduleName]
    module.$$unregisterEmitter(modulePipe)
    delete module.$$actor
    modulePipe.close()
    delete this.modulePipes[moduleName]
    delete this.loadedModules[moduleName]
  }

  /**
   * Unload sub module
   * @param {string} moduleName - Name of module
   * @param {string[]} subModuleNames - Name of sub modules
   * @returns {*}
   */
  async unloadSub (moduleName, subModuleNames) {
    for (const subModuleName of subModuleNames) {
      await this.unload([moduleName, subModuleName].join('.'))
    }
  }

  emit (event, data, options = {}) {
    const {local = false, only = null} = options
    super.emit(event, data)
    if (!local) {
      this.emitToRemote(event, data, {only})
    }
  }

  emitLocally (event, data) {
    this.emit(event, data, {local: true})
  }

  emitToRemote (event, data, options = {}) {
    let {actorPipe} = this
    if (actorPipe) {
      actorPipe.emit(event, data, options)
    } else {
      console.warn('[SUGO-Actor] Not connected!')
    }
  }

  asCallerInstance (caller) {
    const only = [caller.key]
    const emit = (event, data) => this.emitToRemote(event, data, {only})
    return Object.assign({}, caller, {emit})
  }

  /**
   * Assert if the connected to hub
   * @throws {Error}
   */
  assertConnection () {
    assert.ok(this.socket, '[SUGO-Actor] Not connected!')
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
