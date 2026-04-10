import express from "express";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server as SocketIOServer } from "socket.io";

import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { verifyToken } from "./utils/jwt.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Serve static files from frontend
const frontendDir = path.join(__dirname, "../frontend");
app.use(express.static(frontendDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

// Simple health check for the API
app.get("/api/health", (req, res) => {
  res.json({ message: "Smart Attendance System API" });
});

// REST endpoints
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/faculty", facultyRoutes);
app.use("/student", studentRoutes);
app.use("/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

// ---- SOCKET.IO SETUP ----
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Attach io instance to app so controllers can use it
app.set("io", io);

// Socket.IO auth using JWT from handshake.auth.token
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    const decoded = verifyToken(token);
    socket.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id, "role:", socket.user?.role);

  // Faculty (or admin) can join a class room to receive updates
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
    // optional cleanup/logging
  });
});

// ---- START SERVER ----
connectDB()
  .then(() => {
    server.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });

// Global error handlers to prevent crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
