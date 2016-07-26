/**
 * Test case for sugoActor.
 * Runs with mocha.
 */
'use strict'

const SugoActor = require('../lib/sugo_actor.js')
const sgSocket = require('sg-socket')
const Module = require('../module')
const assert = require('assert')
const asleep = require('asleep')
const co = require('co')

const { GreetingEvents, RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')

const { HI, BYE } = GreetingEvents
const { OK, NG } = AcknowledgeStatus
const { SPEC, PERFORM, PIPE } = RemoteEvents

describe('sugo-actor', () => {
  let port = 9872
  let server
  let sockets = {}
  before(() => co(function * () {
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
      socket.on(PIPE, (data) => {
      })
      sockets[ socket.id ] = socket
    })
  }))

  after(() => co(function * () {
    yield asleep(200)
    server.close()
  }))

  it('Sugo actor', () => co(function * () {
    let url = `http://localhost:${port}/actors`
    const MockModuleBash = require('../misc/mocks/mock-module-bash')
    let actor = new SugoActor(url, {
      key: 'hogehoge',
      modules: {
        bash: new MockModuleBash(),
        hoge: new Module({
          hoge () {
            return 'This is hoge!'
          }
        })
      }
    })

    yield actor.connect()
    yield asleep(10)

    for (let id of Object.keys(sockets)) {
      let socket = sockets[ id ]
      let piped = false
      socket.on(PIPE, (data) => {
        assert.ok(data)
        piped = true
      })
      yield new Promise((resolve, reject) =>
        socket.emit(PERFORM, {
          module: 'bash',
          method: 'spawn',
          params: [
            'ls', [ '-la' ], {}
          ]
        }, (res) => resolve())
      )
      yield asleep(10)
      assert.ok(piped)
    }
    yield asleep(100)

    yield actor.disconnect()
  }))
})

/* global describe, before, after, it */
