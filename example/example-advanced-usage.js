#!/usr/bin/env node

'use strict'

const sugoActor = require('sugo-actor')
const co = require('co')
const fs = require('fs')

co(function * () {
  let actor = sugoActor('http://my-sugo-cloud.example.com/actors', {
    key: 'my-actor-01',
    modules: {
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
         * Module specification.
         * @see https://github.com/realglobe-Inc/sg-schemas/blob/master/lib/module_spec.json
         */
        $spec: {
          name: 'sugo-demo-actor-sample',
          version: '1.0.0',
          desc: 'An example method',
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
  yield actor.connect()
}).catch((err) => console.error(err))
