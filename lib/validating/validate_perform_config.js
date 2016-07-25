/**
 * Validate config of perform request.
 * @function validatePerformConfig
 * @param {Object} config
 * @returns {?Error} - Found errors
 */
'use strict'

const sgSchemas = require('sg-schemas')
const sgValidator = require('sg-validator')

/** @lends validatePerformConfig */
function validatePerformConfig (config) {
  let errors = sgValidator(sgSchemas.performConfig).validate(config)
  if (errors && errors.length > 0) {
    return new Error(`[SUGO-Actor] Invalid config ${errors[ 0 ].message}`)
  }
  return null
}

module.exports = validatePerformConfig
