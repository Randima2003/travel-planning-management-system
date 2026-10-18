
require("dotenv").config();

const { createServer } = require("node:http");
const app = require("./app");
const pool = require("./config/db");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const bookingService = require("./services/booking.service");

const PORT = process.env.PORT || 5000;
const server = createServer(app);
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim());
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const isLocalVite = origin && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      callback(null, !origin || isLocalVite || allowedOrigins.includes(origin));
    },
    credentials: true,
  },
});

app.set("io", io);

io.use((socket, next) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const cookieName = process.env.AUTH_COOKIE_NAME || "venturevista.sid";
    const payload = jwt.verify(cookies[cookieName], process.env.JWT_SECRET);
    socket.data.userId = Number(payload.sub);
    return next();
  } catch {
    return next(new Error("Authentication required"));
  }
});

io.on("connection", (socket) => {
  socket.on("booking:join", async (bookingId, acknowledge = () => {}) => {
    try {
      const authorized = await bookingService.canAccessBooking(socket.data.userId, bookingId);
      if (!authorized) return acknowledge({ success: false, message: "Booking access denied" });
      socket.join(`booking:${Number(bookingId)}`);
      return acknowledge({ success: true });
    } catch {
      return acknowledge({ success: false, message: "Could not join booking chat" });
    }
  });
});

async function startServer() {
  try {
    await pool.query("SELECT 1");

    console.log("MySQL connected successfully");

    server.listen(PORT, () => {
      console.log(`VentureVista API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
