'use strict'

const co = require('co')
const childProcess = require('child_process')

module.exports = function mockSpotBash () {
  /**
   * Handle bash commands
   * @param {Object} ctx - Invoke context
   * @returns {Promise}
   */
  function bash (ctx) {
    let { cmd, params, socket } = ctx
    switch (cmd) {
      case 'exec':
        return co(function * () {
          return yield new Promise((resolve, reject) => {
            let spawned = childProcess.spawn(cmd)
            spawned.stdout.on('data', (data) => socket.emit('stdout', data))
            spawned.stderr.on('data', (data) => socket.emit('stderr', data))
            socket.on('stdin', (data) => spawned.stdin.write(data))
            spawned.on('error', (err) => reject(err))
            spawned.on('close', (code) => resolve(code))
          })
        })
      default :
        throw new Error(`Unknown command: ${cmd}`)
    }
  }

  return Object.assign(bash, {
    $desc: 'Bash interface',
    $methods: {
      exec: { $desc: 'Execute a command' }
    }
  })
}
