/**
 * Interface of edge components connected to spot
 * @class ActorModule
 */
'use strict'

const ActorValidator = require('./actor_validator')
const defaults = require('defaults')
const EventEmitter = require('events')

const notReadyError = () => new Error('[SUGO-Actor] Not ready!')

/** @lends ActorModule */
class ActorModule extends EventEmitter {
  constructor (config = {}) {
    super()
    config = ActorModule.normalize(config)
    ActorModule.validate(config)
    const s = this
    Object.assign(s, config)
  }

  /** Emit an event */
  emit () {
    throw notReadyError()
  }

  /** Register event handler */
  on () {
    throw notReadyError()
  }

  /** De register event handler */
  off () {
    throw notReadyError()
  }

  /**
   * Invoke the module script
   * @param {string} name - Name of action
   * @param {Object} params - Parameters
   */
  $$invoke (name, params) {
    const s = this
    let action = s[ name ]
    if (!action) {
      throw new Error(`Unknown action: ${name}`)
    }
    return Promise.resolve(action.call(s, ...params))
  }

  /**
   * Describe module with JSON compatible format.
   */
  $$describe () {
    const s = this
    return s.$spec || {}
  }

  /**
   * Bind event emitter pipe
   * @param {Object} pipe
   */
  $$pipe (pipe) {
    const s = this
    s.$$pipeInsance = pipe
    Object.assign(s, {
      on (...args) {
        return s.$$pipeInsance.on.apply(pipe, args)
      },
      off (...args) {
        return s.$$pipeInsance.off.apply(pipe, args)
      },
      emit (...args) {
        return s.$$pipeInsance.emit.apply(pipe, args)
      }
    })
  }
}

Object.assign(ActorModule, {
  /**
   * Reserved property names. You cannot declare methods with these names
   * @type {Array.<string>}
   */
  reserved: [ 'emit', 'on', 'off' ],
  /**
   * Compose multiple modules.
   * @param {Object} modules - Module configurations
   * @returns {Object} - Composed modules
   */
  compose (modules) {
    let composed = {}
    for (let name of Object.keys(modules || {})) {
      let moduleConfig = Object.assign({ $name: name }, modules[ name ])
      composed[ name ] = new ActorModule(moduleConfig)
    }
    return composed
  },
  /**
   * Normalize configuration
   * @param {Object} config
   * @returns config
   */
  normalize (config) {
    let { $spec } = defaults(config, {
      $spec: { name: 'anonymous', version: 'unknown' }
    })
    $spec.methods = $spec.methods || {}
    let methodNames = Object.keys(config).filter((name) => !/^\$/.test(name))
    for (let name of methodNames) {
      $spec.methods[ name ] = { name }
    }
    return Object.assign(config, { $spec })
  },
  /**
   * Validate configuration
   * @param {Object} config
   */
  validate (config) {
    let error = new ActorValidator().validateModuleConfig(config)
    if (error) {
      throw new Error(error)
    }
    let { reserved } = ActorModule
    for (let name of Object.keys(config)) {
      let conflict = !!~reserved.indexOf(name)
      if (conflict) {
        let msg = `[SUGO-Actor] You cannot declare method with name "${name}". Since it is reserved`
        throw new Error(msg)
      }
    }
  }
})

module.exports = ActorModule
