/**
 * Validator for spot
 * @class ActorValidator
 */
'use strict'

const sgValidator = require('sg-validator')
const sgSchemas = require('sg-schemas')

/** @lends ActorValidator */
class ActorValidator {
  constructor () {
    const s = this
  }

  /**
   * Validate spec of module
   * @param {Object} config
   * @returns {?Error[]} - Found errors
   */
  validateModuleConfig (config) {
    let { $spec } = config
    let errors = sgValidator(sgSchemas.moduleSpec).validate($spec)
    if (errors && errors.length > 0) {
      let { message } = errors[ 0 ]
      throw new Error(`[SUGO-Actor] Invalid $spec detected. ${message}`)
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
      return new Error(`[SUGO-Actor] Invalid config ${errors[ 0 ].message}`)
    }
    return null
  }
}

module.exports = ActorValidator
