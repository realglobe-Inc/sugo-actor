/**
 * Formatter for emit message
 * @module messageFormatter
 */
'use strict'

const { AcknowledgeStatus } = require('sg-socket-constants')
const { OK, NG } = AcknowledgeStatus
const { isProduction } = require('asenv')
const { EOL } = require('os')

module.exports = Object.assign(exports, {
  /**
   * Format ok message
   * @function ok
   * @param {Object} payload - Payload data
   * @param {Object} meta - Meta data
   * @returns {{status: *, payload: *, meta: *}}
   */
  ok (payload, meta) {
    return { status: OK, payload, meta }
  },
  /**
   * Format ng message
   * @function ng
   * @param {Object} payload - Payload data
   * @returns {Object}
   */
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
