/**
 * Test case for parseActorUrl.
 * Runs with mocha.
 */
'use strict'

const parseActorUrl = require('../lib/parsing/parse_actor_url.js')
const assert = require('assert')


describe('parse-actor-url', function () {
  this.timeout(3000)

  before(() => {

  })

  after(() => {

  })

  it('Parse actor url', () => {
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

  })
})

/* global describe, before, after, it */
