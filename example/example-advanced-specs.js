#!/usr/bin/env node

/**
 * This is an example to define spec on module
 *
 * @see https://github.com/realglobe-Inc/sg-schemas/blob/master/lib/module_spec.json
 */
'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const co = require('co')
const fs = require('fs')

co(function * () {
  let actor = sugoActor({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com',
    key: 'my-actor-01',
    modules: {
      sample01: new Module({
        watchFile (pattern) { /* ... */ },
        /**
         * Module specification.
         * @see https://github.com/realglobe-Inc/sg-schemas/blob/master/lib/module_spec.json
         */
        get $spec () {
          return {
            name: 'sugo-demo-actor-sample',
            version: '1.0.0',
            desc: 'A sample module',
            methods: {
              watchFile: {
                params: [
                  { name: 'pattern', desc: 'Glob pattern files to watch' }
                ]
              }
            }
          }
        }
      })
    }
  })

// Connect to hub
  yield actor.connect()
}).catch((err) => console.error(err))
