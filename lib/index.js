/**
 * Thing edge module
 * @module sugo-spot
 */

'use strict'

const SugoSpot = require('./sugo_spot')
const create = require('./create')

let lib = create.bind(this)

Object.assign(lib, SugoSpot, {
  create,
  SugoSpot
})

module.exports = lib
