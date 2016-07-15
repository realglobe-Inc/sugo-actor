#!/usr/bin/env node

/**
 * This is an example to run actor
 */

'use strict'

const sugoActor = require('sugo-actor')
const co = require('co')

const CLOUD_URL = 'http://my-sugo-cloud.example.com/actors'

co(function * () {
  let actor = sugoActor(CLOUD_URL, {
    key: 'my-actor-01',
    modules: {
      tableTennis: {
        // Declare custom function
        ping (pong) {
          return co(function * () {
            /* ... */
            return pong // Return value to pass caller
          })
        }
      },
      // Use module plugin
      shell: require('sugo-module-shell')({})
    }
  })

// Connect to cloud server
  yield actor.connect()
}).catch((err) => console.error(err))
