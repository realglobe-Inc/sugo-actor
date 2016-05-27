/**
 * @function create
 * @returns {Object}
 */
'use strict'

const SugoSpot = require('./sugo_spot')

/** @lends create */
function create (...args) {
  return new SugoSpot(...args)
}

module.exports = create
