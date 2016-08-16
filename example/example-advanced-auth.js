#!/usr/bin/env node

/**
 * This is an example to use an auth
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
    modules: { /* ... */ },
    // Auth for hub
    auth: {
      token: 'a!09jkl3A'
    }
  })

// Connect to cloud server
  yield actor.connect()
}).catch((err) => console.error(err))
