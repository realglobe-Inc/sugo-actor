#!/usr/bin/env node

/**
 * This is an example to use an actor
 */

'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor

async function tryExample () {
  let actor = sugoActor({
    /** Protocol to connect hub */
    protocol: 'https',
    /** Host name of hub */
    hostname: 'my-sugo-hub.example.com',
    /** Key to identify the actor */
    key: 'my-actor-01',
    /** Modules to load */
    modules: {
      tableTennis: new Module({
        // Declare custom function
        async ping (pong) {
          /* ... */
          return pong // Return value to pass caller
        }
      }),
      // Use module plugin
      shell: require('sugo-module-shell')({})
    }
  })

// Connect to hub
  await actor.connect()
}

tryExample().catch((err) => console.error(err))
