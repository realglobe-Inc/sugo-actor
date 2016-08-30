#!/usr/bin/env node

/**
 * Run browser tests.
 */

'use strict'

process.chdir(`${__dirname}/..`)
process.env.DEBUG = 'sg:*'

const apeTasking = require('ape-tasking')
const co = require('co')
const sgSocket = require('sg-socket')
const { exec } = require('child_process')

const { GreetingEvents, RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')

const { HI, BYE } = GreetingEvents
const { OK, NG } = AcknowledgeStatus
const { SPEC, DESPEC, PERFORM, PIPE } = RemoteEvents

let server
let port = 9872

apeTasking.runTasks('browser test', [
  () => new Promise((resolve, reject) => {
    exec('./ci/browser.js', (err, stdout) => {
      err ? reject(err) : resolve(stdout)
    })
  }),
  () => co(function * () {
    server = sgSocket(port)
    server.of('/actors').on('connection', (socket) => {
      socket.on(HI, (data, callback) => {
        callback({ status: OK, payload: { key: data.key } })
      })
      socket.on(BYE, (data, callback) => {
        callback({ status: OK })
      })
      socket.on(SPEC, (data, callback) => {
        callback({ status: OK })
      })
      socket.on(DESPEC, (data, callback) => {
        callback({ status: OK })
      })
      socket.on(PIPE, (data) => {
      })
    })
  }),
  () => new Promise((resolve, reject) => {
    exec('./node_modules/.bin/karma start', (err, stdout, stderr) => {
      if (err) {
        reject(err)
      }
      console.log(stdout)
      console.error(stderr)
      resolve()
    })
  }),
  () => co(function * () {
    server.close()
  })
], true)
