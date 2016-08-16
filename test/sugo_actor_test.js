/**
 * Test case for sugoActor.
 * Runs with mocha.
 */
'use strict'

const SugoActor = require('../lib/sugo_actor.js')
const sgSocket = require('sg-socket')
const Module = require('../module')
const socketIOAuth = require('socketio-auth')
const assert = require('assert')
const asleep = require('asleep')
const co = require('co')

const { GreetingEvents, RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')

const { HI, BYE } = GreetingEvents
const { OK, NG } = AcknowledgeStatus
const { SPEC, PERFORM, PIPE } = RemoteEvents

describe('sugo-actor', () => {
  let port = 9872
  let io
  let sockets = {}
  before(() => co(function * () {
    io = sgSocket(port)
    let actiorIO = io.of('/actors')
    socketIOAuth(actiorIO, {
      authenticate (socket, data, callback) {
        let valid = data.token === 'mytoken'
        callback(null, valid)
      }
    })
    actiorIO.on('connection', (socket) => {
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
    io.close()
  }))

  it('Sugo actor', () => co(function * () {
    const MockModuleBash = require('../misc/mocks/mock-module-bash')
    let actor = new SugoActor({
      key: 'hogehoge',
      protocol: 'http',
      port,
      auth: {
        token: 'mytoken'
      },
      modules: {
        bash: new MockModuleBash(),
        hoge: new Module({
          sayHoge () {
            return 'This is hoge!'
          }
        })
      }
    })

    {
      let { hoge } = actor.modules
      assert.ok(hoge.$spec.methods.sayHoge)
    }

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

  it('Connect bunch of instances', () => co(function * () {
    let url = `http://localhost:${port}/actors`
    let actors = Array.apply(null, new Array(1000)).map((v, i) => new SugoActor(url, {
      key: `hugehuge-${i}`,
      modules: {
        hoge: new Module({
          sayHoge () {
            return 'This is huge!'
          }
        })
      }
    }))
    Promise.all(actors.map((actor) => actor.connect()))
    yield asleep(100)
    Promise.all(actors.map((actor) => actor.disconnect()))
  }))

  it('Parse url', () => co(function * () {
    assert.equal(
      SugoActor.urlFromConfig({
        port: 3000
      }),
      'http://localhost:3000/actors'
    )
  }))
})

/* global describe, before, after, it */
