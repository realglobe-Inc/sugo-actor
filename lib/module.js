/**
 * Base module
 * @class Module
 */
'use strict'

const { Module, compose, modularize, isModule } = require('sugo-module-base')

module.exports = Object.assign((class extends Module {}), {
  compose, modularize, isModule
})
