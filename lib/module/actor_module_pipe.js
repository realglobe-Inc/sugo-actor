/**
 * Pipe for actor module
 * @class ActorModulePipe
 */
'use strict'

const { EventEmitter } = require('events')
const { RemoteEvents } = require('sg-socket-constants')
const { PIPE } = RemoteEvents

/** @lends ActorModulePipe */
class ActorModulePipe extends EventEmitter {
  constructor (socket, moduleName, defaults) {
    super()
    const s = this

    let emit = s.emit.bind(s)
    
    s.emit = function pipingEmit (event, data) {
      if (s.opening) {
        let piping = Object.assign({}, defaults, {
          event, data, module: moduleName
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
      let { event, data } = received
      emit.call(s, event, data)
    }

    s.opening = false
    s.socket = socket
    s._handlers = {}
  }

  /**
   * Open the pipe.
   */
  open () {
    const s = this
    let { socket, pipeHandler } = s
    if (s.opening) {
      return
    }
    s.opening = true
    socket.on(PIPE, pipeHandler)
  }

  /**
   * Close the pipe.
   */
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

module.exports = ActorModulePipe
