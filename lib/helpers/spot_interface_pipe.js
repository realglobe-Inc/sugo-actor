/**
 * Pipe for spot interface
 * @class SpotInterfacePipe
 */
'use strict'

const { EventEmitter } = require('events')
const { RemoteEvents } = require('sg-socket-constants')
const { PIPE } = RemoteEvents

/** @lends SpotInterfacePipe */
class SpotInterfacePipe extends EventEmitter {
  constructor (socket, interfaceName) {
    super()
    const s = this

    let emit = s.emit
    s.emit = function pipingEmit (event, data) {
      if (s.opening) {
        socket.emit(PIPE, { event, data, interface: interfaceName })
      }
      return emit.call(s, event, data)
    }

    s.pipeHandler = (received) => {
      let hit = received.interface === interfaceName
      if (!hit) {
        return
      }
      let { event, data } = received
      emit.call(s, event, data)
    }
    s.opening = false
    s.socket = socket
    s._handlers = {}
  }

  open () {
    const s = this
    let { socket, pipeHandler } = s
    if (s.opening) {
      return
    }
    s.opening = true
    socket.on(PIPE, pipeHandler)
  }

  close () {
    const s = this
    let { socket, pipeHandler } = s
    if (!s.opening) {
      return
    }
    s.opening = false
    socket.off(PIPE, pipeHandler)
  }
}

module.exports = SpotInterfacePipe
