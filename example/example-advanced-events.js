#!/usr/bin/env node

/**
 * This is an example for use event interface
 */
'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const co = require('co')
const fs = require('fs')

co(function * () {
  let actor = sugoActor('http://my-sugo-hub.example.com/actors', {
    key: 'my-actor-01',
    modules: {
      sample01: new Module({
        // File watch with event emitter
        watchFile (pattern) {
          const s = this
          //  "this" is has interface of EventEmitter class
          return co(function * () {
            let watcher = fs.watch(pattern, (event, filename) => {
              // Emit event to remote terminal
              s.emit('change', { event, filename })
            })
            // Receive event from remote terminal
            s.on('stop', () => watcher.close())
          })
        },
        /**
         * Module specification.
         * @see https://github.com/realglobe-Inc/sg-schemas/blob/master/lib/module_spec.json
         */
        $spec: { /* ... */ }
      })
    }
  })

// Connect to cloud server
  yield actor.connect()
}).catch((err) => console.error(err))
