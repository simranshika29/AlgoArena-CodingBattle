import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import problemRoutes from './routes/problems';
import submissionRoutes from './routes/submissions';
import duelRoutes from './routes/duels';
import userRoutes from './routes/users';
import { DuelManager } from './duels/duelManager';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/duels', duelRoutes);
app.use('/api/users', userRoutes);

// Initialize DuelManager before socket handlers
const duelManager = new DuelManager(io);

// MongoDB connection
const mongoUri = process.env.MONGODB_URI!;
if (!mongoUri) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Socket.io connection handler
io.on('connection', (socket: Socket) => {
  console.log('A user connected with socket ID:', socket.id);

  // Handle duel creation
  socket.on('createDuel', (userData: { userId: string; username: string }) => {
    console.log('Creating duel for user:', userData);
    console.log('Socket ID:', socket.id);
    console.log('DuelManager instance:', duelManager);
    
    try {
      const room = duelManager.createDuel(userData, socket);
      console.log('Room created successfully:', room);
      socket.join(room.id);
      socket.emit('duelCreated', room);
      console.log('duelCreated event emitted to socket:', socket.id);
    } catch (error) {
      console.error('Error creating duel:', error);
      socket.emit('duelError', { message: 'Failed to create duel' });
    }
  });

  // Handle duel joining
  socket.on('joinDuel', async (data: { roomId: string; userId: string; username: string }) => {
    console.log('Joining duel:', data);
    try {
      const room = await duelManager.joinDuel(data.roomId, { userId: data.userId, username: data.username }, socket);
      if (room) {
        socket.join(data.roomId);
        socket.emit('duelJoined', room);
        socket.to(data.roomId).emit('duelUpdate', room);
      } else {
        socket.emit('joinError', { message: 'Room not found or full' });
      }
    } catch (error) {
      console.error('Error joining duel:', error);
      socket.emit('joinError', { message: 'Failed to join duel' });
    }
  });

  // Handle player ready
  socket.on('playerReady', (data: { roomId: string; userId: string }) => {
    console.log('Player ready:', data);
    duelManager.handlePlayerReady(data.roomId, data.userId);
  });

  // Handle get room list
  socket.on('getRoomList', () => {
    console.log('Getting room list');
    const roomList = duelManager.getRoomList();
    socket.emit('roomList', roomList);
  });

  // Handle code submission
  socket.on('submitCode', async (data: { roomId: string; userId: string; code: string; language: string }) => {
    console.log('Code submission:', data);
    const validLanguages = ['javascript', 'python', 'c', 'cpp'];
    if (validLanguages.includes(data.language)) {
      await duelManager.handleSubmission(data.roomId, data.userId, data.code, data.language as 'javascript' | 'python' | 'c' | 'cpp', socket, io);
    } else {
      socket.emit('submissionResult', { success: false, message: 'Invalid language' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Handle cleanup if needed
    duelManager.removePlayerFromDuel(socket.id);
  });
});

// Start server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 