<<<<<<< HEAD
import 'dotenv/config';
import app from './src/app.js';
import { createServer } from 'http';
import { initSocket } from './src/socket/index.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🔗 API URL: http://localhost:${PORT}`);
});
=======
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import "dotenv/config";

import authRoutes from "./routes/authRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import { initSocket } from "./socket.js";

const app = express();

/* ------------------ Middlewares ------------------ */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

/* ------------------ Routes ------------------ */
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/", (req, res) => {
  res.send("Mentorship backend running 🚀");
});

/* ------------------ HTTP + Socket ------------------ */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

initSocket(io);

/* ------------------ Server Start ------------------ */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
>>>>>>> 2de50f0cbd7b699ea4a9dae603b08f34e674c9e8
