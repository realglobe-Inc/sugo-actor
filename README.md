sugo-spot
==========

<!---
This file is generated by ape-tmpl. Do not update manually.
--->

<!-- Badge Start -->
<a name="badges"></a>

[![Build Status][bd_travis_com_shield_url]][bd_travis_com_url]
[![npm Version][bd_npm_shield_url]][bd_npm_url]
[![JS Standard][bd_standard_shield_url]][bd_standard_url]

[bd_repo_url]: https://github.com/realglobe-Inc/sugo-spot
[bd_travis_url]: http://travis-ci.org/realglobe-Inc/sugo-spot
[bd_travis_shield_url]: http://img.shields.io/travis/realglobe-Inc/sugo-spot.svg?style=flat
[bd_travis_com_url]: http://travis-ci.com/realglobe-Inc/sugo-spot
[bd_travis_com_shield_url]: https://api.travis-ci.com/realglobe-Inc/sugo-spot.svg?token=aeFzCpBZebyaRijpCFmm
[bd_license_url]: https://github.com/realglobe-Inc/sugo-spot/blob/master/LICENSE
[bd_codeclimate_url]: http://codeclimate.com/github/realglobe-Inc/sugo-spot
[bd_codeclimate_shield_url]: http://img.shields.io/codeclimate/github/realglobe-Inc/sugo-spot.svg?style=flat
[bd_codeclimate_coverage_shield_url]: http://img.shields.io/codeclimate/coverage/github/realglobe-Inc/sugo-spot.svg?style=flat
[bd_gemnasium_url]: https://gemnasium.com/realglobe-Inc/sugo-spot
[bd_gemnasium_shield_url]: https://gemnasium.com/realglobe-Inc/sugo-spot.svg
[bd_npm_url]: http://www.npmjs.org/package/sugo-spot
[bd_npm_shield_url]: http://img.shields.io/npm/v/sugo-spot.svg?style=flat
[bd_standard_url]: http://standardjs.com/
[bd_standard_shield_url]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg

<!-- Badge End -->


<!-- Description Start -->
<a name="description"></a>

Thing edge module

<!-- Description End -->


<!-- Overview Start -->
<a name="overview"></a>


SUGO-Spot is a local server which works as a client of SUGO-Cloud and forward commands to edge components on internal network. 
  

<!-- Overview End -->


<!-- Sections Start -->
<a name="sections"></a>

<!-- Section from "doc/guides/01.Installation.md.hbs" Start -->

<a name="section-doc-guides-01-installation-md"></a>
Installation
-----

```bash
$ npm install sugo-spot --save
```


<!-- Section from "doc/guides/01.Installation.md.hbs" End -->

<!-- Section from "doc/guides/02.Usage.md.hbs" Start -->

<a name="section-doc-guides-02-usage-md"></a>
Usage
---------

```javascript
#!/usr/bin/env node

/**
 * This is an example to run local spot server
 */

'use strict'

const sugoSpot = require('sugo-spot')
const co = require('co')

const CLOUD_URL = 'http://my-sugo-cloud.example.com/spots'

co(function * () {
  let spot = sugoSpot(CLOUD_URL, {
    key: 'my-spot-01',
    interfaces: {
      // Add plugin to provide shell interface
      shell: require('sugo-interface-shell')({})
    }
  })

// Connect to cloud server
  yield spot.connect()
}).catch((err) => console.error(err))

```


<!-- Section from "doc/guides/02.Usage.md.hbs" End -->


<!-- Sections Start -->


<!-- LICENSE Start -->
<a name="license"></a>

License
-------
This software is released under the [MIT License](https://github.com/realglobe-Inc/sugo-spot/blob/master/LICENSE).

<!-- LICENSE End -->


<!-- Links Start -->
<a name="links"></a>

Links
------

+ [sugos](https://github.com/realglobe-Inc/sugos)
+ [sugo-cloud](https://github.com/realglobe-Inc/sugo-cloud)
+ [sugo-terminal](https://github.com/realglobe-Inc/sugo-terminal)

<!-- Links End -->
