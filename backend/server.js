const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room based on user role and ID
  socket.on('join-room', ({ userId, role }) => {
    socket.join(`user-${userId}`);
    socket.join(`role-${role}`);
    if (role === 'admin') {
      socket.join('admin-room');
    }
    console.log(`User ${userId} (${role}) joined room`);
  });

  // Handle attendance marking
  socket.on('attendance-marked', (data) => {
    // Broadcast to admin room
    io.to('admin-room').emit('attendance-updated', data);
    // Notify specific student
    io.to(`user-${data.studentId}`).emit('my-attendance-updated', data);
  });

  // Handle dashboard updates
  socket.on('request-dashboard-update', () => {
    socket.emit('dashboard-update', { timestamp: new Date() });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Attendance Management API Running' }));

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    server.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });