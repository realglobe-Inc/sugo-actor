#!/usr/bin/env node

/**
 * This is an example to use an auth
 * @see https://github.com/realglobe-Inc/sugo-hub#use-authentication
 */
'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const fs = require('fs')

async function tryAuthExample () {
  let actor = sugoActor({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com',
    key: 'my-actor-01',
    modules: { /* ... */ },
    // Auth for hub
    auth: {
      // The structure of this field depends on `authenticate` logic implemented on SUGO-Hub
      token: 'a!09jkl3A'
    }
  })

// Connect to hub
  await actor.connect()
}

tryAuthExample().catch((err) => console.error(err))
