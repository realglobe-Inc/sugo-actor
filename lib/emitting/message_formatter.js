/**
 * Formatter for emit message
 * @module
 */
'use strict'

const { AcknowledgeStatus } = require('sg-socket-constants')
const { OK, NG } = AcknowledgeStatus
const { isProduction } = require('asenv')
const { EOL } = require('os')

module.exports = Object.assign(exports, {
  ok (payload) {
    return { status: OK, payload }
  },
  ng (payload) {
    if (!payload) {
      return { status: NG }
    }
    return {
      status: NG,
      payload: [
        message || payload,
        isProduction() ? null : stack
      ].filter(Boolean).join(EOL)
    }
  }
})
