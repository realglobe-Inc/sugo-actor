/**
 * Test case for module.
 * Runs with karma.
 */
'use strict'

const Module = require('../shim/browser/module.js')
const assert = require('assert')
const co = require('co')

describe('module', function () {
  this.timeout(3000)

  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Module', () => co(function * () {
    let module = new Module({
      foo () {
        return 'This is foo'
      }
    })
    assert.ok(module)
    assert.equal(module.foo(), 'This is foo')
  }))
})

/* global describe, before, after, it */
