#!/usr/bin/env node

/**
 * This is an example for use event interface
 */
'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const fs = require('fs')

async function tryEventExample () {
  let actor = sugoActor({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com',
    key: 'my-actor-01',
    modules: {
      sample01: new Module({
        // File watch with event emitter
        async watchFile (pattern) {
          const s = this
          //  "this" is has interface of EventEmitter class
          let watcher = fs.watch(pattern, (event, filename) => {
            // Emit event to remote terminal
            s.emit('change', { event, filename })
          })
          // Receive event from remote terminal
          s.on('stop', () => watcher.close())
        },
        /**
         * Module specification.
         * @see https://github.com/realglobe-Inc/sg-schemas/blob/master/lib/module_spec.json
         */
        $spec: { /* ... */ }
      })
    }
  })
// Connect to hub
  await actor.connect()
}
tryEventExample().catch((err) => console.error(err))
