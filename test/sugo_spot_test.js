/**
 * Test case for sugoSpot.
 * Runs with mocha.
 */
'use strict'

const SugoSpot = require('../lib/sugo_spot.js')
const sgSocket = require('sg-socket')
const sgSocketClient = require('sg-socket-client')
const assert = require('assert')
const apemansleep = require('apemansleep')
const co = require('co')

const { GreetingEvents, RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')

const { HI, BYE } = GreetingEvents
const { OK, NG } = AcknowledgeStatus
const { SPEC, PERFORM, PIPE } = RemoteEvents

describe('sugo-spot', () => {
  let sleep = apemansleep.create({})
  let port = 9872
  let server
  before(() => co(function * () {
    server = sgSocket(port)
    server.of('/spots').on('connection', (socket) => {
      socket.on(HI, (data, callback) => {
        callback({ status: OK })
      })
      socket.on(BYE, (data, callback) => {
        callback({ status: OK })
      })
      socket.on(SPEC, (data, callback) => {
        callback({ status: OK })
      })
      socket.on(PIPE, (data) => {
      })
      setTimeout(() => co(function * () {
        socket.eimt(PERFORM, {
          interface: 'bash',
          name: 'spawn',
          params: {
            cmd: 'ls',
            args: '-la',
            options: {}
          }
        }, () => {
          console.log('!!!performed')
        })
      }), 10)
    })
  }))

  after(() => co(function * () {
    yield new Promise((resolve) => {
      setTimeout(() => {
        server.close(resolve())
      }, 200)
    })
  }))

  it('Sugo spot', () => co(function * () {
    let url = `http://localhost:${port}/spots`
    let spot = new SugoSpot(url, {
      key: 'hogehoge',
      interfaces: {
        bash: require('../doc/mocks/mock-spot-bash')()
      }
    })

    yield spot.connect()

    yield sleep.sleep(1200)
    yield spot.disconnect()
  }))
})

/* global describe, before, after, it */
