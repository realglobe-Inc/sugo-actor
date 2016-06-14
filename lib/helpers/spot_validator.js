/**
 * Validator for spot
 * @class SpotValidator
 */
'use strict'

const sgValidator = require('sg-validator')
const sgSchemas = require('sg-schemas')

/** @lends spotValidator */
class SpotValidator {
  constructor () {
    const s = this
  }

  /**
   * Validate spec of interface
   * @param {Object} config
   * @returns {?Error[]} - Found errors
   */
  validateInterfaceConfig (config) {
    let { $spec } = config
    let errors = sgValidator(sgSchemas.interfaceSpec).validate($spec)
    if (errors && errors.length > 0) {
      let { message } = errors[ 0 ]
      throw new Error(`[SUGO-Spot] Invalid $spec detected. ${message}`)
    }
  }

  /**
   * Validate config of perform request.
   * @param {Object} config
   * @returns {?Error} - Found errors
   */
  validatePerformConfig (config) {
    let errors = sgValidator(sgSchemas.performConfig).validate(config)
    if (errors && errors.length > 0) {
      return new Error(`[SUGO-Spot] Invalid config ${errors[ 0 ].message}`)
    }
    return null
  }
}

module.exports = SpotValidator
