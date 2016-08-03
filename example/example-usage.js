#!/usr/bin/env node

/**
 * This is an example to use an actor
 */

'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const co = require('co')

const HUB_URL = 'http://my-sugo-hub.example.com/actors'

co(function * () {
  let actor = sugoActor(HUB_URL, {
    /** Key to identify the actor */
    key: 'my-actor-01',
    /** Modules to load */
    modules: {
      tableTennis: new Module({
        // Declare custom function
        ping (pong) {
          return co(function * () {
            /* ... */
            return pong // Return value to pass caller
          })
        }
      }),
      // Use module plugin
      shell: require('sugo-module-shell')({})
    }
  })

// Connect to cloud server
  yield actor.connect()
}).catch((err) => console.error(err))
