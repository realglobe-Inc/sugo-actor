/**
 * Test case for create.
 * Runs with karma.
 */
'use strict'

const create = require('../shim/browser/create.js')
const assert = require('assert')
const co = require('co')

describe('create', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Create', () => co(function * () {
    let instance = create('http://example.com', {
      key: 'foo'
    })
    assert.ok(instance)
  }))
})

/* global describe, before, after, it */
