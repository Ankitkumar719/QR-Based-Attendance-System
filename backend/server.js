import express from "express";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcryptjs";

import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import { User } from "./models/User.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { verifyToken } from "./utils/jwt.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS CONFIG
const allowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://attendsmart.in",
  "https://attendsmart.in"
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Serve static files from frontend
const frontendDir = path.join(__dirname, "../frontend");
app.use(express.static(frontendDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Smart Attendance System API" });
});

// REST endpoints
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ml", mlRoutes);

app.use(notFound);
app.use(errorHandler);

// ---- SOCKET.IO SETUP ----
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ["websocket", "polling"],
  allowEIO3: true
});

// Attach io instance to app
app.set("io", io);

// Socket auth
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("No token"));
    }

    const decoded = verifyToken(token);

    socket.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id, "role:", socket.user?.role);

  socket.on("join-class", ({ classId }) => {
    if (!classId) return;

    const room = `class:${classId}`;
    socket.join(room);
  });

  socket.on("leave-class", ({ classId }) => {
    if (!classId) return;

    const room = `class:${classId}`;
    socket.leave(room);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ---- START SERVER ----
const PORT = process.env.PORT || env.PORT;

const ensureDefaultAdmin = async () => {
  const existingAdmin = await User.findOne({ role: "admin" });

  if (existingAdmin) {
    console.log(`Admin account already exists: ${existingAdmin.email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD, 10);

  await User.create({
    name: env.DEFAULT_ADMIN_NAME,
    email: env.DEFAULT_ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    role: "admin"
  });

  console.log(`Default admin created: ${env.DEFAULT_ADMIN_EMAIL}`);
};

const startServer = async () => {
  await connectDB();
  await ensureDefaultAdmin();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});

// Global error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
