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
    this.socket = socket
    this.opened = false

    this.pipeHandler = (received) => this.pipeReceived(received)
  }

  pipeReceived (received) {
    let hit = this.shouldPipe(received)
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
    if (this.opened) {
      let { socket } = this
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
    let { socket, pipeHandler } = this
    if (this.opened) {
      return
    }
    this.opened = true
    socket.on(PIPE, pipeHandler)
  }

  /**
   * Close the pipe.
   */
  close () {
    let { socket, pipeHandler } = this
    if (!this.opened) {
      return
    }
    this.opened = false
    socket.off(PIPE, pipeHandler)
  }
}

module.exports = PipeEmitter
