/**
 * Module emitter for WebSocket
 * @class WsEmitter
 */
'use strict'

const { EventEmitter } = require('events')
const { RemoteEvents } = require('sg-socket-constants')
const { PIPE } = RemoteEvents
const { parse, format } = require('sg-serializer')

/** @lends WsEmitter */
class WsEmitter extends EventEmitter {
  constructor (socket, moduleName, defaults) {
    super()
    const s = this

    let emit = s.emit.bind(s)

    s.emit = function pipingEmit (event, data) {
      if (s.opened) {
        let isObject = typeof data === 'object'
        let { payload, meta: types } = isObject ? format(data) : { payload: data }
        let piping = Object.assign({}, defaults, {
          event, data: payload, module: moduleName, meta: { types }
        })
        socket.emit(PIPE, piping)
      }
      return emit.call(s, event, data)
    }

    s.pipeHandler = (received) => {
      let hit = received.module === moduleName
      if (!hit) {
        return
      }
      let { event, data, meta } = received
      let { types } = meta
      if (types) {
        data = parse(data, types, {})
      }
      emit.call(s, event, data)
    }
    s.name = moduleName
    s.opened = false
    s.socket = socket
    s._handlers = {}
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

module.exports = WsEmitter
