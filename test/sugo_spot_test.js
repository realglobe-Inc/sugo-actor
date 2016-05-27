/**
 * Test case for sugoSpot.
 * Runs with mocha.
 */
'use strict'

const SugoSpot = require('../lib/sugo_spot.js')
const sgSocket = require('sg-socket')
const assert = require('assert')
const co = require('co')

const { SpotEvents } = require('sg-socket-constants')

describe('sugo-spot', () => {
  let port = 9872
  let server
  before(() => co(function * () {
    const { HI, BYE, ABOUT } = SpotEvents
    server = sgSocket(port)
    server.on('connection', (socket) => {
      socket.on(HI, (data) => socket.emit(HI))
      socket.on(BYE, (data) => socket.emit(BYE))
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
