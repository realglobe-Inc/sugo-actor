/**
 * Test case for actorValidator.
 * Runs with mocha.
 */
'use strict'

const ActorValidator = require('../lib/helpers/actor_validator.js')
const assert = require('assert')
const co = require('co')

describe('actor-validator', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Spot validator', () => co(function * () {
    let validator = new ActorValidator()
    assert.ok(validator)
  }))
})

/* global describe, before, after, it */
