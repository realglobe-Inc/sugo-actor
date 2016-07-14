/**
 * Interface of edge components connected to spot
 * @class SpotInterface
 */
'use strict'

const SpotValidator = require('./spot_validator')
const defaults = require('defaults')

/** @lends SpotInterface */
class SpotInterface {
  constructor (config = {}) {
    config = SpotInterface.normalize(config)
    SpotInterface.validate(config)
    const s = this
    Object.assign(s, config)
  }

  /**
   * Invoke the interface script
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
   * Describe interface with JSON compatible format.
   */
  $$describe () {
    const s = this
    return s.$spec || {}
  }
}

Object.assign(SpotInterface, {
  /**
   * Compose multiple interfaces.
   * @param {Object} interfaces - Interface configurations
   * @returns {Object} - Composed interfaces
   */
  compose (interfaces) {
    let composed = {}
    for (let name of Object.keys(interfaces || {})) {
      composed[ name ] = new SpotInterface(interfaces[ name ])
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
    let error = new SpotValidator().validateInterfaceConfig(config)
    if (error) {
      throw new Error(error)
    }
  }
})

module.exports = SpotInterface
