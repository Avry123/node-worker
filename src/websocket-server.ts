const http = require("http");
const { Server } = require("socket.io");

// Create an HTTP server
const server = http.createServer();

console.log('Line 7 ', server);
// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (you can restrict this to your frontend URL)
    methods: ["GET", "POST"],
  },
});

// Store user connections by user ID
const userConnections: { [key: string]: string } = {};

// Handle connections
io.on("connection", (socket : any) => {
  console.log("A client connected:", socket.id);

  // Listen for user authentication (e.g., seller ID)
  socket.on("authenticate", (userId : any) => {
    console.log(`User ${userId} authenticated`);
    userConnections[userId] = socket.id; // Map user ID to socket ID
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("A client disconnected:", socket.id);
    // Remove user from connections
    for (const [userId, socketId] of Object.entries(userConnections)) {
      if (socketId === socket.id) {
        delete userConnections[userId];
        break;
      }
    }
  });
});

// Start the server
const PORT = 4000; // Use any available port
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Export the IO instance for use in the worker
module.exports = { io, userConnections };