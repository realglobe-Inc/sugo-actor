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
    let { cmd, params, pipe } = ctx
    switch (cmd) {
      case 'exec':
        return co(function * () {
          return yield new Promise((resolve, reject) => {
            let spawned = childProcess.spawn(cmd)
            spawned.stdout.on('data', (data) => pipe.emit('stdout', data))
            spawned.stderr.on('data', (data) => pipe.emit('stderr', data))
            pipe.on('stdin', (data) => spawned.stdin.write(data))
            spawned.on('error', (err) => reject(err))
            spawned.on('close', (code) => resolve(code))
          })
        })
      default :
        throw new Error(`Unknown command: ${cmd}`)
    }
  }

  return Object.assign(bash, {
    spec: {
      desc: 'Bash interface',
      methods: {
        exec: {
          desc: 'Execute a command',
          params: [
            { name: 'script', type: 'string' }
          ]
        }
      }
    }
  })
}
