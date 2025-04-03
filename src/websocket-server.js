"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userConnections = exports.io = void 0;
var socket_io_1 = require("socket.io");
var http_1 = require("http");
var httpServer = (0, http_1.createServer)();
var io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
    },
});
exports.io = io;
var userConnections = new Map(); // Ensure it's a Map
exports.userConnections = userConnections;
io.on("connection", function (socket) {
    console.log("New client connected: ".concat(socket.id));
    socket.on("register", function (userId) {
        userConnections.set(userId, socket.id);
        console.log("User ".concat(userId, " registered with socket ID ").concat(socket.id));
    });
    socket.on("disconnect", function () {
        userConnections.forEach(function (value, key) {
            if (value === socket.id) {
                userConnections.delete(key);
            }
        });
        console.log("Client disconnected: ".concat(socket.id));
    });
});
// Start the WebSocket server
httpServer.listen(3000, function () {
    console.log("WebSocket server listening on port 3000");
});
