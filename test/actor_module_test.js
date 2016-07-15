/**
 * Test case for spotInterface.
 * Runs with mocha.
 */
'use strict'

const ActorModule = require('../lib/helpers/actor_module.js')
const assert = require('assert')
const co = require('co')

describe('actor-interface', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Spot interface', () => co(function * () {
    let bash = new ActorModule(
      require('../misc/mocks/mock-module-bash')()
    )
    let exitCode = yield bash.$$invoke('spawn', [
      'ls',
      [ '-la', '.' ]
    ], {
      emit (ev, data) {
        console.log(ev, String(data))
      },
      on () {}
    })
    assert.equal(exitCode, 0)
  }))

  it('Normalize config', () => co(function * () {
    let config = ActorModule.normalize({
      foo () {
        return 'bar'
      }
    })
    assert.ok(config.$spec.methods.foo)
  }))
})

/* global describe, before, after, it */
