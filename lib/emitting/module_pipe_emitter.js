/**
 * Pipe emitter for modules
 * @augments PipeEmitter
 * @class ModulePipeEmitter
 */
'use strict'

const PipeEmitter = require('./pipe_emitter')
const {PipeLevels} = require('sugo-constants')
const {MODULE_LEVEL} = PipeLevels

/** @lends ModulePipeEmitter */
class ModulePipeEmitter extends PipeEmitter {
  constructor (socket, moduleName, defaults) {
    super(socket)
    const pipeEmit = this.pipeEmit.bind(this)
    /**
     * Emit event
     * @param {string} event - Name of event
     * @param {Object} data - Event data
     * @param {Object} [options={}] - Optional settings
     * @param {string[]} [options.only] - Target caller keys
     */
    this.emit = function pipingEmitWrap (event, data, options = {}) {
      const {only = null} = options
      pipeEmit(event, data, {
        only,
        defaults: Object.assign({}, defaults, {
          level: MODULE_LEVEL,
          module: moduleName
        })
      })
    }

    this.name = moduleName
  }

  shouldPipe (received) {
    if (received.level !== MODULE_LEVEL) {
      // TODO Support level check
      // return false
    }
    return received.module === this.name
  }
}

module.exports = ModulePipeEmitter
