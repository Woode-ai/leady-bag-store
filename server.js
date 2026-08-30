const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env.local" });

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : "0.0.0.0";
const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

const allowedOrigin = process.env.ALLOWED_ORIGIN;
if (!dev && !allowedOrigin) {
  console.error("ALLOWED_ORIGIN is required in production.");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("JWT_SECRET is required and must be at least 32 characters.");
  process.exit(1);
}

const AUTH_COOKIE_NAME = "leadybag_session";

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? true : allowedOrigin,
      credentials: true,
    },
    maxHttpBufferSize: 64 * 1024,
  });

  io.use((socket, nextMiddleware) => {
    try {
      const authToken =
        socket.handshake.auth?.token ||
        parseCookies(socket.handshake.headers.cookie)[AUTH_COOKIE_NAME];

      if (!authToken) return nextMiddleware(new Error("unauthorized"));

      const payload = jwt.verify(authToken, JWT_SECRET);
      if (
        !payload ||
        typeof payload !== "object" ||
        typeof payload.userId !== "string" ||
        !["customer", "admin"].includes(payload.role)
      ) {
        return nextMiddleware(new Error("unauthorized"));
      }

      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      nextMiddleware();
    } catch {
      nextMiddleware(new Error("unauthorized"));
    }
  });

  function canAccessRoom(socket, roomId) {
    return (
      typeof roomId === "string" &&
      roomId.length <= 128 &&
      (socket.data.role === "admin" || socket.data.userId === roomId)
    );
  }

  io.on("connection", (socket) => {
    socket.on("join_room", (roomId) => {
      if (!canAccessRoom(socket, roomId)) return;
      socket.join(roomId);
    });

    socket.on("send_message", (data) => {
      const roomId = data?.roomId;
      const message = data?.message;

      if (!canAccessRoom(socket, roomId)) return;
      if (typeof message !== "string") return;

      const normalized = message.trim();
      if (!normalized || normalized.length > 4000) return;

      io.to(roomId).emit("receive_message", {
        roomId,
        senderId: socket.data.userId,
        senderRole: socket.data.role,
        message: normalized,
        createdAt: new Date(),
      });
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`Leadybag server listening on ${hostname}:${port}`);
  });
});
