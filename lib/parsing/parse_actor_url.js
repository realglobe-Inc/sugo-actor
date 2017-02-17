/**
 * Parse actor URL
 * @function parseActorUrl
 * @param {Object|string}
 * @returns {string}
 */
'use strict'

const {
  format: formatUrl,
  parse: parseUrl,
  resolve: resolveUrl
} = require('url')
const { get } = require('bwindow')
const { HubUrls } = require('sugo-constants')

/** @lends parseActorUrl */
function parseActorUrl (url) {
  if (typeof url === 'string') {
    let parsed = parseUrl(url)
    if (parsed.pathname === '/') {
      let suggestion = resolveUrl(url, HubUrls.ACTOR_URL)
      console.warn(`[SUGO-Actor][Warning] Passed URL "${url}" seems to be wrong. Did you mean "${suggestion}"?`)
    }
    return url
  }
  let {
    protocol = get('location.protocol') || 'http',
    host = undefined,
    port = get('location.port') || 80,
    hostname = get('location.hostname') || 'localhost',
    pathname = HubUrls.ACTOR_URL
  } = url
  return formatUrl({
    protocol,
    host,
    port,
    hostname,
    pathname
  })
}

module.exports = parseActorUrl
