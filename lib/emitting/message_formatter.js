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
  ok (payload, meta) {
    return { status: OK, payload, meta }
  },
  ng (payload) {
    if (!payload) {
      return { status: NG }
    }
    let { message, stack } = payload
    return {
      status: NG,
      payload: [
        message || payload,
        isProduction() ? null : stack
      ].filter(Boolean).join(EOL)
    }
  }
})
