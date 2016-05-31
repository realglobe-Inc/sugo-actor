/**
 * Test case for sugoSpot.
 * Runs with mocha.
 */
'use strict'

const SugoSpot = require('../lib/sugo_spot.js')
const sgSocket = require('sg-socket')
const assert = require('assert')
const co = require('co')

const { GreetingEvents, RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')

const { HI, BYE } = GreetingEvents
const { OK, NG } = AcknowledgeStatus
const { INTERFACE, ACTION } = RemoteEvents

describe('sugo-spot', () => {
  let port = 9872
  let server
  before(() => co(function * () {
    server = sgSocket(port)
    server.on('connection', (socket) => {
      socket.on(HI, (data, callback) => callback(OK))
      socket.on(BYE, (data, callback) => callback(OK))
      socket.on(INTERFACE, (data, callback) => callback(OK))
    })
  }))

  after(() => co(function * () {
    yield new Promise((resolve) => server.close(resolve()))
  }))

  it('Sugo spot', () => co(function * () {
    let spot = new SugoSpot(`http://localhost:${port}`, {
      key: 'hogehoge',
      interfaces: {
        bash: require('../doc/mocks/mock-spot-bash')()
      }
    })

    yield spot.connect()
    yield spot.disconnect()
  }))
})

/* global describe, before, after, it */
