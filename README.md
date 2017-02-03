 <img src="assets/images/sugo-actor-banner.png" alt="Title Banner"
                    height="148"
                    style="height:148px"
/>


<!---
This file is generated by ape-tmpl. Do not update manually.
--->

<!-- Badge Start -->
<a name="badges"></a>

[![Build Status][bd_travis_shield_url]][bd_travis_url]
[![npm Version][bd_npm_shield_url]][bd_npm_url]
[![JS Standard][bd_standard_shield_url]][bd_standard_url]

[bd_repo_url]: https://github.com/realglobe-Inc/sugo-actor
[bd_travis_url]: http://travis-ci.org/realglobe-Inc/sugo-actor
[bd_travis_shield_url]: http://img.shields.io/travis/realglobe-Inc/sugo-actor.svg?style=flat
[bd_travis_com_url]: http://travis-ci.com/realglobe-Inc/sugo-actor
[bd_travis_com_shield_url]: https://api.travis-ci.com/realglobe-Inc/sugo-actor.svg?token=
[bd_license_url]: https://github.com/realglobe-Inc/sugo-actor/blob/master/LICENSE
[bd_codeclimate_url]: http://codeclimate.com/github/realglobe-Inc/sugo-actor
[bd_codeclimate_shield_url]: http://img.shields.io/codeclimate/github/realglobe-Inc/sugo-actor.svg?style=flat
[bd_codeclimate_coverage_shield_url]: http://img.shields.io/codeclimate/coverage/github/realglobe-Inc/sugo-actor.svg?style=flat
[bd_gemnasium_url]: https://gemnasium.com/realglobe-Inc/sugo-actor
[bd_gemnasium_shield_url]: https://gemnasium.com/realglobe-Inc/sugo-actor.svg
[bd_npm_url]: http://www.npmjs.org/package/sugo-actor
[bd_npm_shield_url]: http://img.shields.io/npm/v/sugo-actor.svg?style=flat
[bd_standard_url]: http://standardjs.com/
[bd_standard_shield_url]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg

<!-- Badge End -->


<!-- Description Start -->
<a name="description"></a>

Actor component of SUGOS.

<!-- Description End -->


<!-- Overview Start -->
<a name="overview"></a>


SUGO-Actor works as a client of [SUGO-Hub][sugo_hub_url] and provides modules to remote [SUGO-Caller][sugo_caller_url] .


<!-- Overview End -->


<!-- Sections Start -->
<a name="sections"></a>

<!-- Section from "doc/guides/00.TOC.md.hbs" Start -->

<a name="section-doc-guides-00-t-o-c-md"></a>

Table of Contents
----------------

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Advanced Usage](#advanced-usage)
  * [Using EventEmitter Interface](#using-eventemitter-interface)
  * [Description with `$spec`](#description-with-spec)
  * [Declare a Single Function as Module](#declare-a-single-function-as-module)
  * [Add Auth Configuration](#add-auth-configuration)
- [License](#license)
- [Links](#links)


<!-- Section from "doc/guides/00.TOC.md.hbs" End -->

<!-- Section from "doc/guides/10.Requirements.md.hbs" Start -->

<a name="section-doc-guides-10-requirements-md"></a>

Requirements
-----

<a href="https://nodejs.org">
  <img src="assets/images/nodejs-banner.png"
       alt="banner"
       height="40"
       style="height:40px"
  /></a>
<a href="https://docs.npmjs.com/">
  <img src="assets/images/npm-banner.png"
       alt="banner"
       height="40"
       style="height:40px"
  /></a>

+ [Node.js ( >=6 )][node_download_url]
+ [npm ( >=4 )][npm_url]

[node_download_url]: https://nodejs.org/en/download/
[npm_url]: https://docs.npmjs.com/


<!-- Section from "doc/guides/10.Requirements.md.hbs" End -->

<!-- Section from "doc/guides/21.Installation.md.hbs" Start -->

<a name="section-doc-guides-21-installation-md"></a>

Installation
-----

```bash
$ npm install sugo-actor --save
```


<!-- Section from "doc/guides/21.Installation.md.hbs" End -->

<!-- Section from "doc/guides/22.Usage.md.hbs" Start -->

<a name="section-doc-guides-22-usage-md"></a>

Usage
---------

 Create an actor instance and connect it to a [SUGO-Hub][sugo_hub_url] server.
 
```javascript
#!/usr/bin/env node

/**
 * This is an example to use an actor
 */

'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const co = require('co')

co(function * () {
  let actor = sugoActor({
    /** Protocol to connect hub */
    protocol: 'https',
    /** Host name of hub */
    hostname: 'my-sugo-hub.example.com',
    /** Key to identify the actor */
    key: 'my-actor-01',
    /** Modules to load */
    modules: {
      tableTennis: new Module({
        // Declare custom function
        ping (pong) {
          return co(function * () {
            /* ... */
            return pong // Return value to pass caller
          })
        }
      }),
      // Use module plugin
      shell: require('sugo-module-shell')({})
    }
  })

// Connect to hub
  yield actor.connect()
}).catch((err) => console.error(err))

```

For more detail, see [API Guide](./doc/api/api.md)

<!-- Section from "doc/guides/22.Usage.md.hbs" End -->

<!-- Section from "doc/guides/23.Advanced Usage.md.hbs" Start -->

<a name="section-doc-guides-23-advanced-usage-md"></a>

Advanced Usage
---------

### Using EventEmitter Interface

The [Module class](https://github.com/realglobe-Inc/sugo-module-base) provide EventEmitter interface like `.on()`, `.off()`, `.emit()` to communicate with remote callers.

```javascript
#!/usr/bin/env node

/**
 * This is an example for use event interface
 */
'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const co = require('co')
const fs = require('fs')

co(function * () {
  let actor = sugoActor({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com',
    key: 'my-actor-01',
    modules: {
      sample01: new Module({
        // File watch with event emitter
        watchFile (pattern) {
          const s = this
          //  "this" is has interface of EventEmitter class
          return co(function * () {
            let watcher = fs.watch(pattern, (event, filename) => {
              // Emit event to remote terminal
              s.emit('change', { event, filename })
            })
            // Receive event from remote terminal
            s.on('stop', () => watcher.close())
          })
        },
        /**
         * Module specification.
         * @see https://github.com/realglobe-Inc/sg-schemas/blob/master/lib/module_spec.json
         */
        $spec: { /* ... */ }
      })
    }
  })

// Connect to hub
  yield actor.connect()
}).catch((err) => console.error(err))

```


### Description with `$spec`

You can describe a module with `$spec` property.
The spec object must conform to [module_spec.json][spec_schema_url], a JSON-Schema.

```javascript
#!/usr/bin/env node

/**
 * This is an example to define spec on module
 *
 * @see https://github.com/realglobe-Inc/sg-schemas/blob/master/lib/module_spec.json
 */
'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const co = require('co')
const fs = require('fs')

co(function * () {
  let actor = sugoActor({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com',
    key: 'my-actor-01',
    modules: {
      sample01: new Module({
        watchFile (pattern) { /* ... */ },
        /**
         * Module specification.
         * @see https://github.com/realglobe-Inc/sg-schemas/blob/master/lib/module_spec.json
         */
        get $spec () {
          return {
            name: 'sugo-demo-actor-sample',
            version: '1.0.0',
            desc: 'A sample module',
            methods: {
              watchFile: {
                params: [
                  { name: 'pattern', desc: 'Glob pattern files to watch' }
                ]
              }
            }
          }
        }
      })
    }
  })

// Connect to hub
  yield actor.connect()
}).catch((err) => console.error(err))

```


### Declare a Single Function as Module

Sometimes you do not want multiple module methods, but only one function.
Just declaring a function as module would do this.

```javascript
#!/usr/bin/env node

/**
 * This is an example to use a function module
 */
'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const co = require('co')
const fs = require('fs')

co(function * () {
  let actor = sugoActor({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com',
    key: 'my-actor-01',
    modules: {
      sample01: new Module({ /* ... */ }),
      // A function as module
      sample02: new Module((foo) => {
        return co(function * () {
          /* ... */
          return 'say yo!'
        })
      })
    }
  })

// Connect to hub
  yield actor.connect()
}).catch((err) => console.error(err))

```

### Add Auth Configuration

You can pass auth config to SUGO-Hub by setting `auth` field on the constructor.

```javascript
#!/usr/bin/env node

/**
 * This is an example to use an auth
 * @see https://github.com/realglobe-Inc/sugo-hub#use-authentication
 */
'use strict'

const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const co = require('co')
const fs = require('fs')

co(function * () {
  let actor = sugoActor({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com',
    key: 'my-actor-01',
    modules: { /* ... */ },
    // Auth for hub
    auth: {
      // The structure of this field depends on `authenticate` logic implemented on SUGO-Hub
      token: 'a!09jkl3A'
    }
  })

// Connect to hub
  yield actor.connect()
}).catch((err) => console.error(err))

```

[spec_schema_url]: https://github.com/realglobe-Inc/sg-schemas/blob/master/lib/module_spec.json


<!-- Section from "doc/guides/23.Advanced Usage.md.hbs" End -->


<!-- Sections Start -->


<!-- LICENSE Start -->
<a name="license"></a>

License
-------
This software is released under the [Apache-2.0 License](https://github.com/realglobe-Inc/sugo-actor/blob/master/LICENSE).

<!-- LICENSE End -->


<!-- Links Start -->
<a name="links"></a>

Links
------

+ [SUGO-Hub][s_u_g_o_hub_url]
+ [SUGO-Caller][s_u_g_o_caller_url]
+ [SUGOS][sugos_url]
+ [Realglobe, Inc.][realglobe,_inc__url]

[s_u_g_o_hub_url]: https://github.com/realglobe-Inc/sugo-hub
[s_u_g_o_caller_url]: https://github.com/realglobe-Inc/sugo-caller
[sugos_url]: https://github.com/realglobe-Inc/sugos
[realglobe,_inc__url]: http://realglobe.jp

<!-- Links End -->
