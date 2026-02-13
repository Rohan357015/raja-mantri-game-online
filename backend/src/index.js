// BACKEND: index.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './lib/db.js';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
import cors from 'cors';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

console.log('🔧 Socket.IO server configured');

// Socket connection handling
io.on("connection", (socket) => {
  console.log("✅ New socket connected:", socket.id);

  socket.on("join-room", (roomCode) => {
    const upperRoomCode = roomCode.toUpperCase();
    socket.join(upperRoomCode);
    console.log(`🔵 Socket ${socket.id} joined room: ${upperRoomCode}`);
    
    // Log all sockets in this room
    io.in(upperRoomCode).fetchSockets().then(sockets => {
      console.log(`📊 Room ${upperRoomCode} has ${sockets.length} socket(s)`);
    });
  });

  socket.on("leave-room", (roomCode) => {
    const upperRoomCode = roomCode.toUpperCase();
    socket.leave(upperRoomCode);
    console.log(`🔴 Socket ${socket.id} left room: ${upperRoomCode}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.set("io", io);

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api', authRoutes);

app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
});