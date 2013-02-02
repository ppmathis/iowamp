/*
 * iowamp - WAMP™ server in NodeJS
 * Copyright (c) 2013 Pascal Mathis <dev@snapserv.net>
 */

/**
 * Attach iowamp to websocket.io server
 * @param {wsio.Server} server Server to use (websocket.io)
 * @return {Server} Instance of server class
 */
exports.attach = function(server) {
    var ws = new (require('./server'))();

    server.on('connection', function(client) {
        ws.onConnection(client);
    });
    return ws;
}