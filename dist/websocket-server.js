"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userConnections = exports.io = void 0;
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const httpServer = (0, http_1.createServer)();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
    },
});
exports.io = io;
const userConnections = new Map(); // Ensure it's a Map
exports.userConnections = userConnections;
io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);
    socket.on("register", (userId) => {
        userConnections.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ID ${socket.id}`);
    });
    socket.on("disconnect", () => {
        userConnections.forEach((value, key) => {
            if (value === socket.id) {
                userConnections.delete(key);
            }
        });
        console.log(`Client disconnected: ${socket.id}`);
    });
});
// Start the WebSocket server
httpServer.listen(3000, () => {
    console.log("WebSocket server listening on port 3000");
});
