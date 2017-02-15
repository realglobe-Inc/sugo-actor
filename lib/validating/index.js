/**
 * Validating modules
 * @module validating
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get validateModules () { return d(require('./validate_modules')) },
  get validatePerformConfig () { return d(require('./validate_perform_config')) }
}
