/*
 * iowamp - WAMP™ server in NodeJS
 * Copyright (c) 2013 Pascal Mathis <dev@snapserv.net>
 */
var util = require('./util');

var messageTypes = {
    WELCOME: 0,
    PREFIX: 1,
    CALL: 2,
    CALLRESULT: 3,
    CALLERROR: 4,
    SUBSCRIBE: 5,
    UNSUBSCRIBE: 6,
    PUBLISH: 7,
    EVENT: 8
};

function getMessageType(typeID) {
    for(var key in messageTypes) {
        if(messageTypes[key] == typeID) {
            return key;
        }
    }
    return 'Unknown (' + typeID + ')';
}

var packets = {};
packets.WELCOME = function(sessionID, serverIdent) {
    var packet = [
        messageTypes.WELCOME,       // Message type
        sessionID,                  // Session ID
        1,                          // Protocol version
        serverIdent                 // Server identification
    ];
    return JSON.stringify(packet);
};

packets.CALLRESULT = function(callID, result) {
    var packet = [
        messageTypes.CALLRESULT,    // Message type
        callID,                     // Call ID
        result                      // Result of the method call
    ];
    return JSON.stringify(packet);
};

packets.CALLERROR = function(callID, errorURI, errorDesc) {
    var packet = [
        messageTypes.CALLERROR,     // Message type
        callID,                     // Call ID
        errorURI,                   // Error URI
        errorDesc                   // Error description
    ];
    return JSON.stringify(packet);
}

var handlers = {};
handlers.PREFIX = function(server, client, prefix, uri) {
    client.prefixes[prefix] = uri;
}

handlers.CALL = function(server, client, callID, procURI) {
    // Get function arguments and parse procURI
    var args = Array.prototype.slice.call(arguments, 4);
    procURI = util.resolveURI(client, procURI);

    // Create callback function
    var cb = function(err, result) {
        if(err) {
            client.send(packets.CALLERROR(callID, 'http://autobahn.tavendo.de/error#generic', err.toString()));
        } else {
            client.send(packets.CALLRESULT(callID, result));
        }
    }

    // Try to call the method
    if(server.rpcClasses.hasOwnProperty(procURI.baseURI)) {
        var rpcClass = server.rpcClasses[procURI.baseURI];
        if(rpcClass.hasOwnProperty(procURI.methodURI)) {
            var rpcMethod = rpcClass[procURI.methodURI];
            rpcMethod.apply(null, [cb].concat(args));
            return;
        }
    }

    // Class or method is unknown
    server.emit('unknownCall', procURI.baseURI, procURI.methodURI, [cb].concat(args));
};

/**
 * Module exports
 */
exports.getMessageType = getMessageType;
exports.messageTypes = messageTypes;
exports.packets = packets;
exports.handlers = handlers;