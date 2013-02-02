/*
 * iowamp - WAMP™ server in NodeJS
 * Copyright (c) 2013 Pascal Mathis <dev@snapserv.net>
 */
var EventEmitter = process.EventEmitter,
    debug = require('debug')('iowamp'),

    protocol = require('./protocols/v1'),
    packets = protocol.packets,
    handlers = protocol.handlers;

/**
 * Server constructor
 * @extends EventEmitter
 * @constructor
 */
function Server() {
    this.rpcClasses = {};
    this.topics = {};
    this.clients = {};
};
Server.prototype.__proto__ = EventEmitter.prototype;

/**
 * Generates a random UUID
 * @param a Placeholder
 * @return {String}
 * @license Taken from: https://gist.github.com/982883 - Thanks!
 */
function generateUUID(a) {
    return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, generateUUID)
}

/**
 * Handles new connections
 * @param {wsio.Socket} client Client instance
 * @return {Server} Own instance for chaining
 */
Server.prototype.onConnection = function(client) {
    var _this = this;

    if(!client.id) client.id = generateUUID();
    client.sid = client.id.split('-')[0];
    client.topics = {};
    client.prefixes = {};

    // Add client to client list and send welcome message
    this.clients[client.id] = client;
    debug('[' + client.sid + '] New connection');
    client.send(packets.WELCOME(client.id, 'iowamp'));

    // React if client sends a message
    client.on('message', function(data) {
        // Try to parse the received data as JSON
        debug('[' + client.sid + '] Data received: ' + data);
        try {
            var msg = JSON.parse(data);
        } catch(e) {
            debug('[' + client.sid + '] Can not parse as JSON');
            return;
        }

        // The parsed JSON data should be an array
        if(!Array.isArray(msg)) {
            debug('[' + client.sid + '] Invalid packet (should be an array)');
            return;
        }

        // Checks if an handler exists
        var messageType = protocol.getMessageType(msg.shift());
        if(!handlers.hasOwnProperty(messageType)) {
            debug('[' + client.sid + '] No handler implemented for message type: ' + messageType);
            return;
        }

        // Call the handler with its arguments
        handlers[messageType].apply(_this, [_this, client].concat(msg));
    });

    // React if client closes connection
    client.on('close', function() {
        debug('[' + client.sid + '] Closed connection');
        if(!client.id) return;

        // Remove client in all topics and the client list
        for(var topic in Object.keys(client.topics)) {
            delete _this.topics[topic][client.id];
        }
        delete _this.clients[client.id];
    });

    // Specify an empty error handler
    client.on('error', function(error) {
        debug('[' + client.sid + '] ' + error.toString());
    });

    return this;
}

Server.prototype.rpc = function(baseURI, rpcClass) {
    var _this = this;

    var rpcClassConstructor = {
        register: function(name, method) {
            _this.rpcClasses[baseURI][name] = method;
        }
    };

    this.rpcClasses[baseURI] = {};
    rpcClass.apply(rpcClassConstructor);
}

/**
 * Module exports
 * @type Server
 */
module.exports = Server;