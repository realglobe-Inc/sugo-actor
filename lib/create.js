/**
 * @function create
 * @returns {Object}
 */
'use strict'

const SugoActor = require('./sugo_actor')

/** @lends create */
function create (...args) {
  return new SugoActor(...args)
}

module.exports = create
