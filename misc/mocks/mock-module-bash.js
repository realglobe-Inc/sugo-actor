'use strict'

const co = require('co')
const Module = require('../../module')
const childProcess = require('child_process')

module.exports = class MockModuleBash extends Module {
  get $spec () {
    return {
      name: 'mock-bash',
      version: '1.0.0',
      desc: 'Bash module',
      methods: {
        spawn: {
          desc: 'Spawn a command',
          params: [
            { name: 'cmd', type: 'string', desc: 'Command to spawn' },
            { name: 'args', type: 'array', desc: 'Command arguments' },
            { name: 'options', type: 'object', desc: 'Optional settings' }
          ]
        }
      }
    }
  }

  spawn (cmd, args, options) {
    const s = this
    return co(function * () {
      return yield new Promise((resolve, reject) => {
        let spawned = childProcess.spawn(cmd, args, options)
        spawned.stdout.on('data', (data) => s.emit('stdout', data))
        spawned.stderr.on('data', (data) => s.emit('stderr', data))
        s.on('stdin', (data) => spawned.stdin.write(data))
        spawned.on('error', (err) => reject(err))
        spawned.on('close', (code) => resolve(code))
      })
    })
  }
}
