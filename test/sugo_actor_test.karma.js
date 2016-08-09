/**
 * Test case for sugoActor.
 * Runs with karma.
 */
'use strict'

const SugoActor = require('../shim/browser/sugo_actor')
const Module = require('../shim/browser/module')
const assert = require('assert')
const asleep = require('asleep')
const co = require('co')

describe('sugo-actor', () => {
  let port = 9872
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Sugo actor', () => co(function * () {
    let actor = new SugoActor({
      key: 'hogehoge',
      protocol: 'http',
      port,
      modules: {
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
})

/* global describe, before, after, it */
