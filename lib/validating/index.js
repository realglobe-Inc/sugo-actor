/**
 * Validating modules
 * @module validating
 */

'use strict'

const d = (module) => module && module.default || module

const validateModules = d(require('./validate_modules'))
const validatePerformConfig = d(require('./validate_perform_config'))

module.exports = {
  validateModules,
  validatePerformConfig
}
