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
   * @param {Object} $spec
   * @returns {?Error[]} - Found errors
   */
  validateInterfaceSpec ($spec) {
    return sgValidator(sgSchemas.interfaceSpec).validate($spec)
  }

  /**
   * Validate config of perform request.
   * @param {Object} config
   * @returns {?Error[]} - Found errors
   */
  validatePerformConfig (config) {
    return sgValidator(sgSchemas.performConfig).validate(config)
  }
}

module.exports = SpotValidator
