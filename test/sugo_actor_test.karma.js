/**
 * Test case for sugoActor.
 * Runs with karma.
 */
'use strict'

const SugoActor = require('../shim/browser/sugo_actor')
const Module = require('../shim/browser/module')
const assert = require('assert')
const asleep = require('asleep')


describe('sugo-actor', function () {
  this.timeout(16000)
  let port = 9872
  before(() => {

  })

  after(() => {

  })

  it('Sugo actor', () => {
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

    await actor.connect()

    await asleep(100)

    await actor.disconnect()
  })

  it('Connect bunch of instances', () => {
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
    })
    Promise.all(actors.map((actor) => actor.connect()))
    await asleep(100)
    Promise.all(actors.map((actor) => actor.disconnect()))
  })
})

/* global describe, before, after, it */
