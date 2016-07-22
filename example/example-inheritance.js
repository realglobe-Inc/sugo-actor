#!/usr/bin/env node

/**
 * This is an example to use module inheritance
 */

'use strict'

const sugoActor = require('sugo-actor')
const co = require('co')

const CLOUD_URL = 'http://my-sugo-cloud.example.com/actors'

co(function * () {
  let actor = sugoActor(CLOUD_URL, {
    key: 'my-actor-01',
    modules: {
      moduleA: {},
      moduleB: {}
    }
  })

// Connect to cloud server
  yield actor.connect()
}).catch((err) => console.error(err))
