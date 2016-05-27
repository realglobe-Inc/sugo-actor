'use strict'

module.exports = function mockSpotBash () {
  /**
   * Handle bash commands
   * @param {string} cmd - Name of command
   * @returns {Promise}
   */
  function bash (cmd) {

  }

  return Object.assign(bash, {
    $desc: 'Bash interface',
    $methods: {
      exec: {
        $params: []
      }
    }
  })
}
