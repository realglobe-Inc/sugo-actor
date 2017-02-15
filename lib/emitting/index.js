/**
 * Emitting modules
 * @module emitting
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get messageFormatter () { return d(require('./message_formatter')) },
  get WsEmitter () { return d(require('./ws_emitter')) }
}
