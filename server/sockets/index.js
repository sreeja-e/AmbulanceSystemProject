const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

function initSockets(httpServer, { corsOrigin }) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization || "").replace("Bearer ", "");
    if (!token) return next(new Error("Missing token"));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.user || {};
    if (role) socket.join(`role:${role}`);
    if (id) socket.join(`user:${id}`);

    socket.on("disconnect", () => {});
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { initSockets, getIO };

