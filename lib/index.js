/**
 * Actor component of SUGOS.
 * @module sugo-actor
 * @version 4.5.3
 * @license Apache-2.0
 */

'use strict'

const SugoActor = require('./sugo_actor')
const Module = require('./module')
const create = require('./create')
const { compose, modularize } = Module

let lib = create.bind(this)

Object.assign(lib, SugoActor, {
  create,
  compose,
  modularize,
  SugoActor,
  Module
})

module.exports = lib
