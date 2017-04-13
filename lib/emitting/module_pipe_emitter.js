/**
 * Pipe emitter for modules
 * @augments PipeEmitter
 * @class ModulePipeEmitter
 */
'use strict'

const PipeEmitter = require('./pipe_emitter')
const { PipeLevel } = require('sugo-constants')
const { MODULE_LEVEL } = PipeLevel

/** @lends ModulePipeEmitter */
class ModulePipeEmitter extends PipeEmitter {
  constructor (socket, moduleName, defaults) {
    super(socket)
    const s = this

    /**
     * Emit event
     * @param {string} event - Name of event
     * @param {Object} data - Event data
     * @param {Object} [options={}] - Optional settings
     * @param {string[]} [options.only] - Target caller keys
     */
    s.emit = function pipingEmit (event, data, options = {}) {
      let { only = null } = options
      s.pipeEmit(event, data, {
        only,
        defaults: Object.assign({}, defaults, {
          level: MODULE_LEVEL,
          module: moduleName
        })
      })
    }

    s.name = moduleName
  }

  shouldPipe (received) {
    const s = this
    if (received.level !== MODULE_LEVEL) {
      // TODO Support level check
      // return false
    }
    return received.module === s.name
  }
}

module.exports = ModulePipeEmitter
