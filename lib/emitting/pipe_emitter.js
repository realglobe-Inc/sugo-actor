/**
 * Pipe emitter
 * @abstract
 * @class PipeEmitter
 */
'use strict'

const { EventEmitter } = require('events')
const { RemoteEvents } = require('sg-socket-constants')
const { PIPE } = RemoteEvents
const { parse, format } = require('sg-serializer')

/** @lends PipeEmitter */
class PipeEmitter extends EventEmitter {
  constructor (socket) {
    super()
    const s = this
    s.socket = socket
    s.opened = false

    s.pipeHandler = (received) => s.pipeReceived(received)
  }

  pipeReceived (received) {
    const s = this
    let hit = s.shouldPipe(received)
    if (!hit) {
      return
    }
    let { event, data, meta } = received
    let { types } = meta
    if (types) {
      data = parse(data, types, {})
    }
    super.emit(event, data)
  }

  pipeEmit (event, data, options = {}) {
    const s = this
    if (s.opened) {
      let { socket } = s
      let {
        only = null,
        defaults = {}
      } = options
      let isObject = typeof data === 'object'
      let { payload, meta: types } = isObject ? format(data) : { payload: data }
      let piping = Object.assign({}, defaults, {
        event,
        data: payload,
        meta: { types },
        only
      })
      socket.emit(PIPE, piping)
    }
    super.emit(event, data)
  }

  /**
   * Open the pipe.
   */
  open () {
    const s = this
    let { socket, pipeHandler } = s
    if (s.opened) {
      return
    }
    s.opened = true
    socket.on(PIPE, pipeHandler)
  }

  /**
   * Close the pipe.
   */
  close () {
    const s = this
    let { socket, pipeHandler } = s
    if (!s.opened) {
      return
    }
    s.opened = false
    socket.off(PIPE, pipeHandler)
  }
}

module.exports = PipeEmitter
