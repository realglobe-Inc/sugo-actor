#!/usr/bin/env node

/**
 * This is an example to detect caller join/leave
 */
'use strict'

const sugoActor = require('sugo-actor')
const { CallerEvents } = sugoActor
const co = require('co')

const { JOIN, LEAVE } = CallerEvents

co(function * () {
  let actor = sugoActor({ /* ... */ })

  actor.on(JOIN, ({ caller, messages }) => {
    console.log(`Caller ${caller.key} joined with messages: ${messages}`)
  })

  actor.on(LEAVE, ({ caller, messages }) => {
    console.log(`Caller ${caller.key} leaved with messages: ${messages}`)
  })

// Connect to hub
  yield actor.connect()
}).catch((err) => console.error(err))
