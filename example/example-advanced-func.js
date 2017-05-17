#!/usr/bin/env node

/**
 * This is an example to use a function module
 */
'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const fs = require('fs')

async function tryFuncExample () {
  let actor = sugoActor({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com',
    key: 'my-actor-01',
    modules: {
      sample01: new Module({ /* ... */ }),
      // A function as module
      sample02: new Module(async function (foo) {
        /* ... */
        return 'say yo!'
      })
    }
  })

  // Connect to hub
  await actor.connect()
}

tryFuncExample().catch((err) => console.error(err))
