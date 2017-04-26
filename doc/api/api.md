# sugo-actor@4.6.4

Actor component of SUGOS.

+ Functions
  + [sugoActor(config)](#sugo-actor-function-sugo-actor)
+ [`SugoActor`](#sugo-actor-classes) Class
  + [new SugoActor(url, config)](#sugo-actor-classes-sugo-actor-constructor)
  + [actor.connect()](#sugo-actor-classes-sugo-actor-connect)
  + [actor.disconnect()](#sugo-actor-classes-sugo-actor-disconnect)
  + [actor.perform(data)](#sugo-actor-classes-sugo-actor-perform)
  + [actor.load(moduleName, module)](#sugo-actor-classes-sugo-actor-load)
  + [actor.loadSub(moduleName, subModules)](#sugo-actor-classes-sugo-actor-loadSub)
  + [actor.unload(moduleName)](#sugo-actor-classes-sugo-actor-unload)
  + [actor.unloadSub(moduleName, subModuleNames)](#sugo-actor-classes-sugo-actor-unloadSub)
  + [actor.assertConnection()](#sugo-actor-classes-sugo-actor-assertConnection)
  + [actor.urlFromConfig()](#sugo-actor-classes-sugo-actor-urlFromConfig)
  + [actor.parseActorUrl()](#sugo-actor-classes-sugo-actor-parseActorUrl)

## Functions

<a class='md-heading-link' name="sugo-actor-function-sugo-actor" ></a>

### sugoActor(config) -> `SugoActor`

Create an actor instance. Just an alias of `new SugoActor(config)`

| Param | Type | Description |
| ----- | --- | -------- |
| config | Object | Sugo caller configuration |

```javascript
co(function * () {
  let actor = sugoActor({
    key: 'my-actor-01',
    modules: {
    }
  })
  yield actor.connect()
}).catch((err) => console.error(err))
```


<a class='md-heading-link' name="sugo-actor-classes"></a>

## `SugoActor` Class



**Extends**: 

+ `SugoClient`



<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-constructor" ></a>

### new SugoActor(url, config)

Constructor of SugoActor class

| Param | Type | Description |
| ----- | --- | -------- |
| url | string | Cloud server url |
| config | object | Configurations |
| config.key | string | Key of actor |
| config.auth | object | Auth object |
| config.modules | object.&lt;String, SugoActorModule&gt; | Modules to load. |
| config.path | string | Socket.IO option. |


<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-connect" ></a>

### actor.connect() -> `Promise`

Connect to hub.
By call this, actor share specification of the modules to hub so that callers can access them.

<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-disconnect" ></a>

### actor.disconnect() -> `Promise`

Disconnect from the hub

<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-perform" ></a>

### actor.perform(data) -> `Promise`

Handle perform event

| Param | Type | Description |
| ----- | --- | -------- |
| data | object |  |


<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-load" ></a>

### actor.load(moduleName, module) -> `Promise`

Load a module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |
| module | Object | Module to load |


<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-loadSub" ></a>

### actor.loadSub(moduleName, subModules) -> `Promise`

Load sub modules

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string |  |
| subModules | Object |  |


<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-unload" ></a>

### actor.unload(moduleName) -> `Promise`

Unload a module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |


<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-unloadSub" ></a>

### actor.unloadSub(moduleName, subModuleNames) -> `*`

Unload sub module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |
| subModuleNames | Array.&lt;string&gt; | Name of sub modules |


<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-assertConnection" ></a>

### actor.assertConnection()

Assert if the connected to hub

<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-urlFromConfig" ></a>

### actor.urlFromConfig()



<a class='md-heading-link' name="sugo-actor-classes-sugo-actor-parseActorUrl" ></a>

### actor.parseActorUrl()

Parse actor url



