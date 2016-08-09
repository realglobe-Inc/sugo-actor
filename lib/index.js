/**
 * Actor component of SUGOS.
 * @module sugo-actor
 * @version 4.1.4
 * @license Apache-2.0
 */

'use strict'

const SugoActor = require('./sugo_actor')
const Module = require('./module')
const create = require('./create')

let lib = create.bind(this)

Object.assign(lib, SugoActor, {
  create,
  SugoActor,
  Module
})

module.exports = lib
