/**
 * Interface of edge components connected to spot
 * @class ActorModule
 */
'use strict'

const ActorValidator = require('./actor_validator')
const defaults = require('defaults')

/** @lends ActorModule */
class ActorModule {
  constructor (config = {}) {
    config = ActorModule.normalize(config)
    ActorModule.validate(config)
    const s = this
    Object.assign(s, config)
  }

  /**
   * Invoke the module script
   * @param {string} name - Name of action
   * @param {Object} params - Parameters
   * @param pipe
   */
  $$invoke (name, params, pipe) {
    const s = this
    let action = s[ name ]
    if (!action) {
      throw new Error(`Unknown action: ${name}`)
    }
    let ctx = { params, pipe }
    return Promise.resolve(action.call(ctx, ctx))
  }

  /**
   * Describe module with JSON compatible format.
   */
  $$describe () {
    const s = this
    return s.$spec || {}
  }
}

Object.assign(ActorModule, {
  /**
   * Compose multiple modules.
   * @param {Object} modules - Module configurations
   * @returns {Object} - Composed modules
   */
  compose (modules) {
    let composed = {}
    for (let name of Object.keys(modules || {})) {
      composed[ name ] = new ActorModule(modules[ name ])
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
  }
})

module.exports = ActorModule
