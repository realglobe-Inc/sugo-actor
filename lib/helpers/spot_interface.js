/**
 * @class SpotInterface
 */
'use strict'

/** @lends SpotInterface */
class SpotInterface {
  constructor (config) {
    const s = this
    let { $spec, $actions } = config
    Object.assign(s, {
      $spec, $actions
    })
  }

  /**
   * Invoke the interface script
   * @param {string} name - Name of action
   * @param {Object} params - Parameters
   * @param pipe
   */
  invoke (name, params, pipe) {
    const s = this
    let action = s.$actions[ name ]
    if (!action) {
      throw new Error(`Unknown action: ${name}`)
    }
    let ctx = { params, pipe }
    return Promise.resolve(action.call(ctx, ctx))
  }

  /**
   * Describe interface with JSON compatible format.
   */
  describe () {
    const s = this
    return s.$spec || {}
  }
}

Object.assign(SpotInterface, {
  compose (interfaces) {
    let composed = {}
    for (let name of Object.keys(interfaces || {})) {
      composed[ name ] = new SpotInterface(interfaces[ name ])
    }
    return composed
  }
})

module.exports = SpotInterface
