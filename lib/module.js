/**
 * Base module
 * @class Module
 */
'use strict'

const { Module, compose } = require('sugo-module-base')

module.exports = Object.assign((class extends Module {}), { compose })
