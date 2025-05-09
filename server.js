const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const User = require("./models/User");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["polling"]
});

// Ensure uploads folder
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend files

// 🔥 Middleware for protected routes
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token, auth denied" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
}

// ---------------------- AUTH ROUTES ----------------------
app.post("/signup", [
  body("name").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("learnSkill").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, learnSkill, teachSkill } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const skills = [learnSkill, teachSkill].filter(Boolean);
    const user = new User({ name, email, password: hashed, skills });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, userId: user._id, name });
  } catch (err) {
    res.status(500).json({ msg: "Signup failed" });
  }
});

app.post("/login", [
  body("email").isEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, userId: user._id, name: user.name });
  } catch (err) {
    res.status(500).json({ msg: "Login failed" });
  }
});

// ---------------------- PROFILE ROUTES ----------------------
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Failed to load profile" });
  }
});

app.get("/api/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching user" });
  }
});

// ---------------------- SOCKET.IO ----------------------
const users = {}; // socket.id -> { userId, name }
const userSocketMap = {}; // userId -> socket.id

io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.id);

  socket.on("join", ({ userId, name }) => {
    users[socket.id] = { userId, name };
    userSocketMap[userId] = socket.id;
    console.log(`🧩 User joined: ${name} (${userId})`);
    // Broadcast updated user list to all clients
    const userList = Object.values(users).map(u => ({ name: u.name, userId: u.userId }));
    io.emit("user list", userList);
  });

  // Handle chat messages (global and private)
  socket.on("chat message", (data) => {
    if (data.to === "global") {
      // Broadcast global message to all
      io.emit("chat message", data);
    } else {
      // Private message: send to target and echo to sender
      const targetSocketId = userSocketMap[data.to];
      if (targetSocketId) {
        io.to(targetSocketId).emit("chat message", data);
      }
      // Emit back to sender so they see their own message
      io.to(socket.id).emit("chat message", data);
    }
  });

  // Handle existing private messaging (if used)
  socket.on("privateMessage", (data) => {
    const targetSocketId = userSocketMap[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("privateMessage", data);
    }
  });

  // Call signaling events
  socket.on("call-user", ({ from, name, to, offer }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", { from, name, offer });
    }
  });

  socket.on("send-answer", ({ to, answer }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("receive-answer", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("call-rejected", ({ to }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-rejected");
    }
  });

  socket.on("end-call", ({ to }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("end-call");
    }
  });

  socket.on("disconnect", () => {
    const disconnectedUser = users[socket.id];
    if (disconnectedUser) {
      delete userSocketMap[disconnectedUser.userId];
    }
    delete users[socket.id];
    console.log("❌ Disconnected:", socket.id);
    // Update and broadcast active user list
    const userList = Object.values(users).map(u => ({ name: u.name, userId: u.userId }));
    io.emit("user list", userList);
  });
});

// ⚡️ Fallback for frontend after all routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------------------- START SERVER ----------------------
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
