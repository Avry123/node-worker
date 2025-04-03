import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const userConnections = new Map<string, string>(); // Ensure it's a Map

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on("register", (userId: string) => {
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

export { io, userConnections };
