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
const {ok, equal, deepEqual} = require('assert')
const asleep = require('asleep')
const aport = require('aport')

const uuid = require('uuid')

const {
  GreetingEvents,
  RemoteEvents,
  AcknowledgeStatus
} = require('sg-socket-constants')
const {CallerEvents} = require('sugo-constants')

const {HI, BYE} = GreetingEvents
const {OK, NG} = AcknowledgeStatus
const {SPEC, DESPEC, PERFORM, PIPE} = RemoteEvents

describe('sugo-actor', function () {
  this.timeout(16000)

  const handle = (socket) => {
    socket.on(HI, (data, callback) =>
      callback({status: OK, payload: {key: data.key}})
    )
    socket.on(BYE, (data, callback) =>
      callback({status: OK})
    )
    socket.on(SPEC, (data, callback) =>
      callback({status: OK})
    )

    socket.on(DESPEC, (data, callback) =>
      callback({status: OK})
    )
    socket.on(PIPE, (data) => {})
    sockets[socket.id] = socket
  }

  let port = 9872
  let io
  let sockets = {}
  before(() => {
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
  })

  after(async () => {
    await asleep(200)
    io.close()
    await asleep(100)
  })

  it('Sugo actor', async () => {
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
      let {hoge} = actor.modules
      ok(hoge.$spec.methods.sayHoge)
    }

    await actor.connect()
    await asleep(10)

    for (let id of Object.keys(sockets)) {
      let socket = sockets[id]
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
          'ls', ['-la'], {}
        ]
      })
      await asleep(10)
    }
    await asleep(100)

    await actor.disconnect()
  })

  it('With auth', async () => {
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
      await actor.connect()
      await asleep(10)
      await actor.disconnect()
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
        await actor.connect()
        await asleep(10)
        await actor.disconnect()
      } catch (e) {
        caught = e
      }
      ok(caught)
    }
  })

  it('Connect bunch of instances', async () => {
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
      await actor.connect()
    }
    await asleep(100)
    for (let actor of actors) {
      await actor.disconnect()
    }
    await asleep(100)
  })

  it('Parse url', async () => {
    equal(
      SugoActor.urlFromConfig({
        port: 3000
      }),
      'http://localhost:3000/actors'
    )
  })

  it('Load nested modules', async () => {
    let port = await aport()
    let hub = await sugoHub({}).listen(port)
    let actor = new SugoActor({
      key: 'hogehoge',
      port,
      multiplex: false,
      reconnection: false,
      modules: {
        db: new Module({
          async open () {
            const s = this
            let {$$actor} = s
            await $$actor.loadSub('db', {
              User: new Module({
                findAll () {
                  return [{name: 'User01'}]
                }
              })
            })
          },
          async close () {
            const s = this
            let {$$actor} = s
            await $$actor.unloadSub('db', ['User'])
          }
        }),
        'db.Article': new Module({
          getTitle () {
            return 'This is title!'
          },
          somethingWrong () {
            let error = new Error('Something is wrong!')
            Object.assign(error, {name: 'SOMETHING_WRONG_ERROR'})
            throw error
          },
          doNull () {
            return null
          }
        })
      }
    })

    await actor.connect()
    await asleep(100)

    let actorJoinMessages = {}
    let actorLeaveMessages = {}
    actor.on(CallerEvents.JOIN, ({caller, messages}) => {
      actorJoinMessages[caller.key] = messages
    })

    actor.on(CallerEvents.LEAVE, ({caller, messages}) => {
      actorLeaveMessages[caller.key] = messages
    })

    await actor.load('fileAccess',
      new Module({
        writer: new Module({
          write () {}
        }),
        reader: new Module({
          read () {}
        })
      })
    )

    {
      let caller = sugoCaller({port})
      ok(caller)
      equal(Object.keys(actorJoinMessages).length, 0)
      let hogehoge = await caller.connect('hogehoge', {
        messages: {initial: 'h'}
      })
      equal(Object.keys(actorJoinMessages).length, 1)
      let db = hogehoge.get('db')
      await db.open()

      await asleep(10)
      {
        let {User} = db
        deepEqual((await User.findAll()), [{name: 'User01'}])
      }
      await db.close()
      await asleep(10)
      {
        let {User} = db
        ok(!User)
      }

      let {Article} = db
      ok(await Article.getTitle())

      {
        let caught = await Article.somethingWrong().catch((e) => e)
        ok(caught)
      }

      {
        ok((await Article.doNull()) === null)
      }

      let fileAccess = hogehoge.get('fileAccess')
      await fileAccess.writer.write()

      equal(Object.keys(actorLeaveMessages).length, 0)

      await hogehoge.disconnect()

      equal(Object.keys(actorLeaveMessages).length, 1)
    }

    await actor.disconnect()
    await asleep(100)
    await hub.close()
    await asleep(100)
  })

  it('Specify callers to receive events', async () => {
    let port = await aport()
    let hub = await sugoHub({}).listen(port)
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

    let caller01 = sugoCaller({port})
    let caller02 = sugoCaller({port})

    await actor.connect()

    let granted = []
    actor.on(CallerEvents.JOIN, ({caller, messages}) => {
      if (messages.who === 'caller02') {
        return
      }
      granted.push(caller.key)
      caller.emit('foo', {name: 'Foo'})
    })

    await asleep(200)

    let shoppingMallFor01 = await caller01.connect('shoppingMall', {messages: {who: 'caller01'}})
    let shoppingMallFor02 = await caller02.connect('shoppingMall', {messages: {who: 'caller02'}})

    await asleep(100)

    let news = {}
    shoppingMallFor01.get('fruitShop').on('news', (data) => {
      news['01'] = data
    })
    shoppingMallFor02.get('fruitShop').on('news', (data) => {
      news['02'] = data
    })

    fruitShop.emit('news', {say: 'Welcome!'}, {
      only: granted
    })

    await asleep(300)

    ok(news['01'])
    ok(!news['02'])

    await caller01.disconnect()
    await caller02.disconnect()
    await asleep(100)
    await actor.disconnect()
    await asleep(100)
    await hub.close()
    await asleep(100)
  })
})

/* global describe, before, after, it */
