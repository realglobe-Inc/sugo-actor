/**
 * Emitting modules
 * @module emitting
 */

'use strict'

const d = (module) => module && module.default || module

const ActorPipeEmitter = d(require('./actor_pipe_emitter'))
const messageFormatter = d(require('./message_formatter'))
const ModulePipeEmitter = d(require('./module_pipe_emitter'))
const PipeEmitter = d(require('./pipe_emitter'))

module.exports = {
  ActorPipeEmitter,
  messageFormatter,
  ModulePipeEmitter,
  PipeEmitter
}
