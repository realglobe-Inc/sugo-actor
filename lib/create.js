/**
 * Create an actor instance. Just an alias of `new SugoActor(config)`
 * @function sugoActor
 * @param {Object} config - Sugo caller configuration
 * @returns {SugoActor}
 * @example

;(async () => {
  let actor = sugoActor({
    key: 'my-actor-01',
    modules: {
    }
  })
  await actor.connect()
})().catch((err) => console.error(err))

 */
'use strict'

const SugoActor = require('./sugo_actor')

/** @lends sugoActor */
function create (...args) {
  return new SugoActor(...args)
}

module.exports = create
