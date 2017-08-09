/**
 * Test case for create.
 * Runs with karma.
 */
'use strict'

const create = require('../shim/browser/create.js')
const assert = require('assert')


describe('create', () => {
  before(() => {

  })

  after(() => {

  })

  it('Create', () => {
    let instance = create('http://example.com', {
      key: 'foo'
    })
    assert.ok(instance)
  })
})

/* global describe, before, after, it */
