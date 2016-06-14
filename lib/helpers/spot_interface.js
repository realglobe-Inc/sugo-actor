/**
 * Interface of edge components connected to spot
 * @class SpotInterface
 */
'use strict'

const SpotValidator = require('./spot_validator')

/** @lends SpotInterface */
class SpotInterface {
  constructor (config = {}) {
    if (config.spec) {
      config.$spec = config.spec
      delete config.spec
    }
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
