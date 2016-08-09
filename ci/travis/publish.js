#!/usr/bin/env node

/**
 * Publish npm package
 */
'use strict'

process.chdir(`${__dirname}/../..`)
const { runTasks } = require('ape-tasking')
const { commitPush, publishNpm } = require('sg-travis')

runTasks([
  () => commitPush({}),
  () => publishNpm({})
])
