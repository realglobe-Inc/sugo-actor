/**
 * Interface of edge components connected to spot
 * @class SpotInterface
 */
'use strict'

const sgValidator = require('sg-validator')
const sgSchemas = require('sg-schemas')

/** @lends SpotInterface */
class SpotInterface {
  constructor (config) {
    SpotInterface.validate(config.$spec)

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
    return s.$spec || s.spec || {}
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
   * @param {Object} $spec
   */
  validate ($spec) {
    let validator = sgValidator(sgSchemas.interface)
    let errors = validator.validate($spec)
    if (errors) {
      let { message } = errors[ 0 ]
      throw new Error(`[SUGO-Spot] Invalid $spec detected. ${message}`)
    }
  }
})

module.exports = SpotInterface
