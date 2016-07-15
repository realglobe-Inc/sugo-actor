#!/usr/bin/env node

/**
 * This is an example to run local spot server
 */

'use strict'

const sugoActor = require('sugo-actor')
const co = require('co')

const CLOUD_URL = 'http://my-sugo-cloud.example.com/spots'

co(function * () {
  let spot = sugoActor(CLOUD_URL, {
    key: 'my-actor-01',
    modules: {
      // Declare custom function
      ping (ctx) {
        let { params } = ctx
        let [ pong ] = params // Parameters passed from remote terminal
        return co(function * () {
          /* ... */
          return pong // Return value to pass remote terminal
        })
      },
      // Use module plugin
      shell: require('sugo-module-shell')({})
    }
  })

// Connect to cloud server
  yield spot.connect()
}).catch((err) => console.error(err))
