#!/usr/bin/env node

/**
 * This is an example to detect caller join/leave
 */
'use strict'

const sugoActor = require('sugo-actor')
const { CallerEvents } = sugoActor

const { JOIN, LEAVE } = CallerEvents

async function tryJoinLeaveExample () {
  let actor = sugoActor({ /* ... */ })

  actor.on(JOIN, ({ caller, messages }) => {
    console.log(`Caller ${caller.key} joined with messages: ${messages}`)
  })

  actor.on(LEAVE, ({ caller, messages }) => {
    console.log(`Caller ${caller.key} leaved with messages: ${messages}`)
  })

// Connect to hub
  await actor.connect()
}

tryJoinLeaveExample().catch((err) => console.error(err))
