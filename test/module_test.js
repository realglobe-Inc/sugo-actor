/**
 * Test case for module.
 * Runs with mocha.
 */
'use strict'

const Module = require('../lib/module.js')
const assert = require('assert')


describe('module', function () {
  this.timeout(3000)

  before(() => {

  })

  after(() => {

  })

  it('Module', () => {
    let module = new Module({
      foo () {
        return 'This is foo'
      }
    })
    assert.ok(module)
    assert.equal(module.foo(), 'This is foo')
  })
})

/* global describe, before, after, it */
