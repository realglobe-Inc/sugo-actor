/**
 * Validate modules to load
 * @function validateModules
 * @param {Object} modules
 * @returns {?Error} - Found errors
 */
'use strict'

const { ReservedNames } = require('sugo-constants')

/** @lends validateModules */
function validateModules (modules) {
  for (let reservedModuleName of ReservedNames.MODULE.split(',')) {
    let ng = modules.hasOwnProperty(reservedModuleName)
    if (ng) {
      return new Error(`[SUGO-Actor] You cannot use "${reservedModuleName}" as a module name since it is reserved.`)
    }
  }
  for (let moduleName of Object.keys(modules)) {
    let module = modules[ moduleName ]
    for (let reservedMethodName of ReservedNames.METHOD.split(',')) {
      let ng = module.hasOwnProperty(reservedMethodName)
      if (ng) {
        return new Error(`[SUGO-Actor] You cannot use "${reservedMethodName} as a method name ( on module "${moduleName}") since it is reserved.`)
      }
    }
  }
  return null
}

module.exports = validateModules
