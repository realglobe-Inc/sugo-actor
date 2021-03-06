/**
 * Test case for validateModules.
 * Runs with mocha.
 */
'use strict'

const validateModules = require('../lib/validating/validate_modules.js')
const assert = require('assert')


describe('validate-modules', function () {
  this.timeout(3000)

  before(() => {

  })

  after(() => {

  })

  it('Validate modules', () => {
    {
      let error = validateModules({
        foo: {
          bar () {}
        }
      })
      assert.ok(!error, 'Should be fine')
    }
    {
      let error = validateModules({
        module: { // Reserved name
          bar () {}
        }
      })
      assert.ok(error, 'Should be error with reserved module name')
    }
    {
      let error = validateModules({
        foo: {
          addListener () { // Reserved name

          }
        }
      })
      assert.ok(error, 'Should be error with reserved method name')
    }
  })
})

/* global describe, before, after, it */
