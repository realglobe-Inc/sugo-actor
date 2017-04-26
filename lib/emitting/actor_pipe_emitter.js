/**
 * Pipe Emitter for actors
 * @class ActorPipeEmitter
 */
'use strict'

const PipeEmitter = require('./pipe_emitter')
const { PipeLevels } = require('sugo-constants')
const { ACTOR_LEVEL } = PipeLevels

/** @lends ActorPipeEmitter */
class ActorPipeEmitter extends PipeEmitter {
  constructor (socket, defaults) {
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
          level: ACTOR_LEVEL
        })
      })
    }
  }

  shouldPipe (received) {
    return !received.module || (received.level === ACTOR_LEVEL)
  }
}

module.exports = ActorPipeEmitter
