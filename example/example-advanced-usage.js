#!/usr/bin/env node

'use strict'

const sugoSpot = require('sugo-spot')
const co = require('co')
const fs = require('fs')

co(function * () {
  let spot = sugoSpot('http://my-sugo-cloud.example.com/spots', {
    key: 'my-spot-01',
    interfaces: {
      sample01: {
        // File watch with event emitter
        watchFile (ctx) {
          //  ctx.pipe is an instance of EventEmitter class
          let { params, pipe } = ctx
          let [ pattern ] = params
          return co(function * () {
            let watcher = fs.watch(pattern, (event, filename) => {
              // Emit event to remote terminal
              pipe.on('change', { event, filename })
            })
            // Receive event from remote terminal
            pipe.on('stop', () => {
              watcher.close()
            })
          })
        },
        /**
         * Interface specification.
         * @see https://github.com/realglobe-Inc/sg-schemas/blob/master/lib/interface_spec.json
         */
        $spec: {
          name: 'sugo-demo-spot-sample',
          version: '1.0.0',
          desc: 'An example interface',
          methods: {
            watchFile: {
              params: [
                { name: 'pattern', desc: 'Glob pattern files to watch' }
              ]
            }
          }
        }
      }
    }
  })

// Connect to cloud server
  yield spot.connect()
}).catch((err) => console.error(err))
