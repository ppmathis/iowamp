# iowamp #

iowamp is a WAMP™ server in NodeJS. Currently it only supports basic RPC calls, but pub/sub support is coming. It attaches to [WebSocket.IO](http://github.com/learnboost/websocket.io).

## License ##
Apache License (version 2)

## Prerequisites ##
iowamp itselfs requires version 0.6.x of NodeJS or higher. If you want to run the tests, you'll want Vows.

To really use iowamp, you will also need websocket.io

## Installing with [NPM](http://npmjs.org) ##
```
npm install iowamp
```

## Attach iowamp to a websocket.io server ##
Before you can start using iowamp in your project, you need to attach it to an websocket.io instance of your choice:

```javascript
var iowamp = require('./lib'),
    wsio = require('websocket.io');

var server = wsio.listen(8000);
var app = iowamp.attach(server);
```

## Register a RPC class with methods ##
Registering a RPC class with some methods is also easy - here is an example for it:

```javascript
var iowamp = require('./lib'),
    wsio = require('websocket.io');

var server = wsio.listen(8000);
var app = iowamp.attach(server);

app.rpc('http://example.com/calc#', function() {
    this.register('add', function(cb, a, b) {
        cb(null, a + b);
    });
});
```

The code should be kinda self-explanatory, allthough here is some additional information:

**app.rpc(baseURI, constructor)** registers a new RPC class

- *baseURI* The base URI for the class. It must be a complete URI and it should end with a #. (A CURIE / compact URI is not allowed)
- *constructor* Should be a function which registers some RPC methods (will get called in the iowamp scope)

**this.register(name, method)**

- *name* The name of the method. To call the method in a WAMP client, you would need to specifiy the baseURI and the method name like here: http://example.com/calc#add
- *method* The method which should be called. The first parameter is always the callback function, followed by the arguments passed from the WAMP client.

**cb(error, result)** Kinda self-explanatory. If an error will be passed, a generic error will be send back to the WAMP client. If not, the result will be send back.

## Catching unknown methods ##
If you want to catch methods which are unknown / not declared, you can listen for the *unknownCall* event:

```javascript
app.on('unknownCall', function(baseURI, method, callback, args...) {
// Your code goes here
});
```

- - -
iowamp NodeJS WAMP™ server - © 2012-2013 P. Mathis (dev@snapserv.net)