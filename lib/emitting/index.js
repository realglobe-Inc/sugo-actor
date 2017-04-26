/**
 * Emitting modules
 * @module emitting
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get ActorPipeEmitter () { return d(require('./actor_pipe_emitter')) },
  get messageFormatter () { return d(require('./message_formatter')) },
  get ModulePipeEmitter () { return d(require('./module_pipe_emitter')) },
  get PipeEmitter () { return d(require('./pipe_emitter')) }
}
