#!/usr/bin/env node

/**
 * This is an example to use a function module
 */
'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const co = require('co')
const fs = require('fs')

co(function * () {
  let actor = sugoActor('http://my-sugo-cloud.example.com/actors', {
    key: 'my-actor-01',
    modules: {
      sample01: new Module({ /* ... */ }),
      // A function as module
      sample02: new Module((foo) => {
        return co(function * () {
          /* ... */
          return 'say yo!'
        })
      })
    }
  })

// Connect to cloud server
  yield actor.connect()
}).catch((err) => console.error(err))
