'use strict'

const co = require('co')
const childProcess = require('child_process')

module.exports = function mockSpotBash () {
  return {
    $actions: {
      spawn (ctx) {
        let { params, pipe } = ctx
        return co(function * () {
          return yield new Promise((resolve, reject) => {
            let [ cmd, args, options ] = params
            let spawned = childProcess.spawn(cmd, args, options)
            spawned.stdout.on('data', (data) => pipe.emit('stdout', data))
            spawned.stderr.on('data', (data) => pipe.emit('stderr', data))
            pipe.on('stdin', (data) => spawned.stdin.write(data))
            spawned.on('error', (err) => reject(err))
            spawned.on('close', (code) => resolve(code))
          })
        })
      }
    },
    $spec: {
      $desc: 'Bash interface',
      $methods: {
        exec: {
          $desc: 'Spawn a command',
          $params: [
            { $name: 'cmd', $type: 'string', $desc: 'Command to spawn' },
            { $name: 'args', $type: 'array', $desc: 'Command arguments' },
            { $name: 'options', $type: 'Object', $desc: 'Optional settings' }
          ]
        }
      }
    }
  }
}
