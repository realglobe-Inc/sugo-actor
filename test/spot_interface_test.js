/**
 * Test case for spotInterface.
 * Runs with mocha.
 */
'use strict'

const SpotInterface = require('../lib/helpers/spot_interface.js')
const assert = require('assert')
const co = require('co')

describe('spot-interface', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Spot interface', () => co(function * () {
    let bash = new SpotInterface(
      require('../doc/mocks/mock-interface-bash')()
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
})

/* global describe, before, after, it */
