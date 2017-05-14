/**
 * Test case for sugoActor.
 * Runs with mocha.
 */
'use strict'

const SugoActor = require('../lib/sugo_actor.js')
const sgSocket = require('sg-socket')
const Module = require('../module')
const sugoHub = require('sugo-hub')
const sugoCaller = require('sugo-caller')
const socketIOAuth = require('socketio-auth')
const { ok, equal, deepEqual } = require('assert')
const asleep = require('asleep')
const aport = require('aport')
const co = require('co')
const uuid = require('uuid')
const { hasBin } = require('sg-check')

const {
  GreetingEvents,
  RemoteEvents,
  AcknowledgeStatus
} = require('sg-socket-constants')
const { CallerEvents } = require('sugo-constants')

const { HI, BYE } = GreetingEvents
const { OK, NG } = AcknowledgeStatus
const { SPEC, DESPEC, PERFORM, PIPE } = RemoteEvents

describe('sugo-actor', function () {
  this.timeout(16000)

  let handle = (socket) => {
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
    sockets[ socket.id ] = socket
  }

  let port = 9872
  let io
  let sockets = {}
  before(() => co(function * () {
    io = sgSocket(port)
    let actorIO = io.of('/actors')
    actorIO.on('connection', handle)
    let actorAuthIO = io.of('/auth/actors')
    socketIOAuth(actorAuthIO, {
      authenticate (socket, data, callback) {
        let valid = data.token === 'mytoken'
        callback(null, valid)
      }
    })
    actorAuthIO.on('connection', handle)
  }))

  after(() => co(function * () {
    yield asleep(200)
    io.close()
    yield asleep(100)
  }))

  it('Sugo actor', () => co(function * () {
    const MockModuleBash = require('../misc/mocks/mock-module-bash')
    let actor = new SugoActor({
      key: 'hogehoge',
      protocol: 'http',
      multiplex: false,
      reconnection: false,
      port,
      modules: {
        bash: new MockModuleBash(),
        hoge: new Module({
          sayHoge () {
            return 'This is hoge!'
          }
        })
      }
    })

    ok(actor.clientType)

    {
      let { hoge } = actor.modules
      ok(hoge.$spec.methods.sayHoge)
    }

    yield actor.connect()
    yield asleep(10)

    for (let id of Object.keys(sockets)) {
      let socket = sockets[ id ]
      let piped = false
      socket.on(PIPE, (data) => {
        ok(data)
        piped = true
      })
      socket.emit(PERFORM, {
        pid: uuid.v4(),
        module: 'bash',
        method: 'spawn',
        params: [
          'ls', [ '-la' ], {}
        ]
      })
      yield asleep(10)

    }
    yield asleep(100)

    yield actor.disconnect()
  }))

  it('With auth', () => co(function * () {
    {
      let actor = new SugoActor({
        key: 'hogehoge2',
        pathname: '/auth/actors',
        multiplex: false,
        reconnection: false,
        port,
        auth: {
          token: 'mytoken'
        },
        modules: {}
      })
      yield actor.connect()
      yield asleep(10)
      yield actor.disconnect()
    }
    {
      let actor = new SugoActor({
        key: 'hogehoge2',
        pathname: '/auth/actors',
        port,
        auth: {
          token: '__invalid_token__'
        },
        modules: {}
      })
      let caught
      try {
        yield actor.connect()
        yield asleep(10)
        yield actor.disconnect()
      } catch (e) {
        caught = e
      }
      ok(caught)
    }
  }))

  it('Connect bunch of instances', () => co(function * () {
    let url = `http://localhost:${port}/actors`
    let actors = Array.apply(null, new Array(20)).map((v, i) => new SugoActor(url, {
      key: `hugehuge-${i}`,
      multiplex: false,
      reconnection: false,
      modules: {
        hoge: new Module({
          sayHoge () {
            return 'This is huge!'
          }
        })
      }
    }))
    for (let actor of actors) {
      yield actor.connect()
    }
    yield asleep(100)
    for (let actor of actors) {
      yield actor.disconnect()
    }
    yield asleep(100)
  }))

  it('Parse url', () => co(function * () {
    equal(
      SugoActor.urlFromConfig({
        port: 3000
      }),
      'http://localhost:3000/actors'
    )
  }))

  it('Load nested modules', () => co(function * () {
    let port = yield aport()
    let hub = yield sugoHub({}).listen(port)
    let actor = new SugoActor({
      key: 'hogehoge',
      port,
      multiplex: false,
      reconnection: false,
      modules: {
        db: new Module({
          open () {
            const s = this
            let { $$actor } = s
            return co(function * () {
              yield $$actor.loadSub('db', {
                User: new Module({
                  findAll () {
                    return [ { name: 'User01' } ]
                  }
                })
              })
            })
          },
          close () {
            const s = this
            let { $$actor } = s
            return co(function * () {
              yield $$actor.unloadSub('db', [ 'User' ])
            })
          }
        }),
        'db.Article': new Module({
          getTitle () {
            return 'This is title!'
          },
          somethingWrong () {
            let error = new Error('Something is wrong!')
            Object.assign(error, { name: 'SOMETHING_WRONG_ERROR' })
            throw error
          }
        })
      }
    })

    yield actor.connect()
    yield asleep(100)

    let actorJoinMessages = {}
    let actorLeaveMessages = {}
    actor.on(CallerEvents.JOIN, ({ caller, messages }) => {
      actorJoinMessages[ caller.key ] = messages
    })

    actor.on(CallerEvents.LEAVE, ({ caller, messages }) => {
      actorLeaveMessages[ caller.key ] = messages
    })

    yield actor.load('fileAccess', new Module({
      writer: new Module({
        write () {}
      }),
      reader: new Module({
        read () {}
      })
    }))

    {
      let caller = sugoCaller({ port })
      ok(caller)
      equal(Object.keys(actorJoinMessages).length, 0)
      let hogehoge = yield caller.connect('hogehoge', {
        messages: { initial: 'h' }
      })
      equal(Object.keys(actorJoinMessages).length, 1)
      let db = hogehoge.get('db')
      yield db.open()

      yield asleep(10)
      {
        let { User } = db
        deepEqual((yield User.findAll()), [ { name: 'User01' } ])
      }
      yield db.close()
      yield asleep(10)
      {
        let { User } = db
        ok(!User)
      }

      let { Article } = db
      ok(yield Article.getTitle())

      {
        let caught = yield Article.somethingWrong().catch((e) => e)
        ok(caught)
      }

      let fileAccess = hogehoge.get('fileAccess')
      yield fileAccess.writer.write()

      equal(Object.keys(actorLeaveMessages).length, 0)

      yield hogehoge.disconnect()

      equal(Object.keys(actorLeaveMessages).length, 1)
    }

    yield actor.disconnect()
    yield asleep(100)
    yield hub.close()
    yield asleep(100)
  }))

  it('Specify callers to receive events', () => co(function * () {
    let port = yield aport()
    let hub = yield sugoHub({}).listen(port)
    let fruitShop = new Module({
      buy () {}
    })
    let actor = new SugoActor({
      key: 'shoppingMall',
      port,
      modules: {
        fruitShop
      }
    })

    let caller01 = sugoCaller({ port })
    let caller02 = sugoCaller({ port })

    yield actor.connect()

    let granted = []
    actor.on(CallerEvents.JOIN, ({ caller, messages }) => {
      if (messages.who === 'caller02') {
        return
      }
      granted.push(caller.key)
      caller.emit('foo', { name: 'Foo' })
    })

    yield asleep(100)

    let shoppingMallFor01 = yield caller01.connect('shoppingMall', { messages: { who: 'caller01' } })
    let shoppingMallFor02 = yield caller02.connect('shoppingMall', { messages: { who: 'caller02' } })

    let news = {}
    shoppingMallFor01.get('fruitShop').on('news', (data) => {
      news[ '01' ] = data
    })
    shoppingMallFor02.get('fruitShop').on('news', (data) => {
      news[ '02' ] = data
    })

    fruitShop.emit('news', { say: 'Welcome!' }, {
      only: granted
    })

    yield asleep(200)

    ok(news[ '01' ])
    ok(!news[ '02' ])

    yield caller01.disconnect()
    yield caller02.disconnect()
    yield actor.disconnect()
    yield asleep(100)
    yield hub.close()
    yield asleep(100)
  }))
})

/* global describe, before, after, it */
