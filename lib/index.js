/**
 * Function provider client of SUGOS.
 * @module sugo-actor
 */

'use strict'

const SugoActor = require('./sugo_actor')
const create = require('./create')

let lib = create.bind(this)

Object.assign(lib, SugoActor, {
  create,
  SugoActor
})

module.exports = lib
