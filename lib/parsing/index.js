/**
 * Parsing modules
 * @module parsing
 */

'use strict'

const d = (module) => module && module.default || module

const parseActorUrl = d(require('./parse_actor_url'))

module.exports = {
  parseActorUrl
}
