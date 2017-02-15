/**
 * Parsing modules
 * @module parsing
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get parseActorUrl () { return d(require('./parse_actor_url')) }
}
