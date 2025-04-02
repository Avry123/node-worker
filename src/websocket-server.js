var http = require("http");
var Server = require("socket.io").Server;
// Create an HTTP server
var server = http.createServer();
console.log('Line 7 ', server);
// Initialize Socket.IO
var io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (you can restrict this to your frontend URL)
        methods: ["GET", "POST"],
    },
});
// Store user connections by user ID
var userConnections = {};
// Handle connections
io.on("connection", function (socket) {
    console.log("A client connected:", socket.id);
    // Listen for user authentication (e.g., seller ID)
    socket.on("authenticate", function (userId) {
        console.log("User ".concat(userId, " authenticated"));
        userConnections[userId] = socket.id; // Map user ID to socket ID
    });
    // Handle disconnections
    socket.on("disconnect", function () {
        console.log("A client disconnected:", socket.id);
        // Remove user from connections
        for (var _i = 0, _a = Object.entries(userConnections); _i < _a.length; _i++) {
            var _b = _a[_i], userId = _b[0], socketId = _b[1];
            if (socketId === socket.id) {
                delete userConnections[userId];
                break;
            }
        }
    });
});
// Start the server
var PORT = 4000; // Use any available port
server.listen(PORT, function () {
    console.log("WebSocket server running on port ".concat(PORT));
});
// Export the IO instance for use in the worker
module.exports = { io: io, userConnections: userConnections };
