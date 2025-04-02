import WebSocket, { WebSocketServer } from "ws";

interface UserConnections {
  [userId: string]: WebSocket;
}

const wss = new WebSocketServer({ port: 4000 }); // WebSocket server running on port 8080
const userConnections: UserConnections = {}; // Store connected clients

console.log("🚀 WebSocket server started on ws://localhost:8080");

wss.on("connection", (ws: WebSocket) => {
  console.log("✅ New WebSocket client connected");

  ws.on("message", (message: string) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "register" && data.userId) {
        userConnections[data.userId] = ws; // Associate user ID with the WebSocket connection
        console.log(`👤 User ${data.userId} registered for updates`);
        ws.send(JSON.stringify({ message: "Registration successful" }));
      }
    } catch (error) {
      console.error("❌ Invalid WebSocket message format", error);
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  });

  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
    // Remove disconnected clients
    Object.keys(userConnections).forEach((userId) => {
      if (userConnections[userId] === ws) {
        delete userConnections[userId];
        console.log(`👤 User ${userId} removed from active connections`);
      }
    });
  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });

  // Heartbeat mechanism to detect inactive clients
  ws.on("pong", () => {
    (ws as any).isAlive = true;
  });
});

// Periodically check for inactive clients
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!(ws as any).isAlive) {
      console.log("❌ Removing inactive client");
      return ws.terminate();
    }
    (ws as any).isAlive = false;
    ws.ping();
  });
}, 30000); // Check every 30 seconds

export { wss, userConnections };
