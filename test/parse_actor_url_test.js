/**
 * Test case for parseActorUrl.
 * Runs with mocha.
 */
'use strict'

const parseActorUrl = require('../lib/parsing/parse_actor_url.js')
const assert = require('assert')
const co = require('co')

describe('parse-actor-url', function () {
  this.timeout(3000)

  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Parse actor url', () => co(function * () {
    assert.equal(
      parseActorUrl('http://localhost:3000/actors'),
      'http://localhost:3000/actors'
    )

    assert.equal(
      parseActorUrl('http://localhost:3000'),
      'http://localhost:3000'
    )

    assert.equal(
      parseActorUrl({
        port: 3001,
        hostname: 'example.com'
      }),
      'http://example.com:3001/actors'
    )

  }))
})

/* global describe, before, after, it */
