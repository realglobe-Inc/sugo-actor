/**
 * Module for actor
 * @class SugoActorModule
 * @param {Object} methods - Module methods
 */
'use strict'

const { Module, compose, modularize, isModule } = require('sugo-module-base')

module.exports = Object.assign((class SugoActorModule extends Module {}), {
  compose, modularize, isModule
})
