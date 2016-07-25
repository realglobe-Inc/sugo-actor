#!/usr/bin/env node

/**
 * This is an example to use module inheritance
 */

'use strict'

const sugoActor = require('sugo-actor')
const co = require('co')

const CLOUD_URL = 'http://my-sugo-cloud.example.com/actors'

class Module {

}

const HiPeople = (superclass = Module) => class extends superclass {
  sayHi () { console.log('Hi!') }
}

const YoPeople = (superclass = Module) => class extends superclass {
  sayYo () { console.log('Yo!') }
}

class MyPerson extends HiPeople(YoPeople(Module)) {
  sayHiAndYo () {
    const s = this
    s.sayHi()
    s.sayYo()
  }
}

co(function * () {
  let actor = sugoActor(CLOUD_URL, {
    key: 'my-actor-01',
    modules: {
      person01: new MyPerson()
    }
  })

  // Connect to cloud server
  yield actor.connect()
}).catch((err) => console.error(err))
