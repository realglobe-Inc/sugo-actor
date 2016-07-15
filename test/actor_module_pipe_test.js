/**
 * Test case for spotInterfacePipe.
 * Runs with mocha.
 */
'use strict'

const ActorModulePipe = require('../lib/helpers/actor_module_pipe.js')
const assert = require('assert')
const co = require('co')

describe('actor-module-pipe', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Spot interface pipe', () => co(function * () {
    let pipe = new ActorModulePipe()
    assert.ok(pipe)
  }))
})

/* global describe, before, after, it */
