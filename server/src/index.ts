import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db';
import Message from './models/Message';

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import teamRoutes from './routes/teams';
import userRoutes from './routes/users';
import auditLogRoutes from './routes/auditLogs';
import analyticsRoutes from './routes/analytics';
import chatRoutes from './routes/chat';
import commentRoutes from './routes/comments'; // ✅ ADD THIS

// Load environment variables
dotenv.config();

// Initialize express app
const app: Application = express();
const httpServer = createServer(app);

// Connect to MongoDB
connectDB();

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://dev4flow.vercel.app'],
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/comments', commentRoutes); // ✅ ADD THIS

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================
// Socket.io Setup
// ============================================

const io = new Server(httpServer, {
  cors: corsOptions,
});

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

// Socket.io Authentication Middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    socket.data.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.user?.id;
  console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`);

  // Store user as online
  if (userId) {
    onlineUsers.set(userId, socket.id);
    
    // Send current online users list to the newly connected user
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('onlineUsersList', { userIds: onlineUserIds });
    
    // Broadcast to ALL clients that this user is online
    io.emit('userOnline', { userId });
    
    console.log(`📋 Online users (${onlineUserIds.length}):`, onlineUserIds);
  }

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Handle sending messages
  socket.on('sendMessage', async (data: { receiverId: string; message: string }) => {
    try {
      const { receiverId, message } = data;
      const senderId = userId;

      // Save message to database
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        message: message.trim(),
      });

      // Populate sender and receiver info
      await newMessage.populate('sender', 'name avatar email');
      await newMessage.populate('receiver', 'name avatar email');

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', newMessage);
      }

      // Send confirmation to sender
      socket.emit('messageSent', newMessage);

      console.log(`📨 Message from ${senderId} to ${receiverId}`);
    } catch (error: any) {
      console.error('Send message error:', error);
      socket.emit('messageError', { message: 'Failed to send message' });
    }
  });

  // ✅ Handle new comment
  socket.on('newComment', async (data: { taskId: string; comment: any }) => {
    try {
      // Broadcast to all users in the project
      io.emit('commentAdded', {
        taskId: data.taskId,
        comment: data.comment,
      });
      console.log(`💬 New comment on task ${data.taskId}`);
    } catch (error: any) {
      console.error('New comment broadcast error:', error);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data: { receiverId: string }) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('userTyping', {
        userId,
        name: socket.data.user?.name,
      });
    }
  });

  // Handle stop typing
  socket.on('stopTyping', (data: { receiverId: string }) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('userStopTyping', { userId });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${userId}`);
    
    if (userId) {
      onlineUsers.delete(userId);
      
      // Broadcast to all clients that this user is offline
      io.emit('userOffline', { userId });
      
      const remainingOnline = Array.from(onlineUsers.keys());
      console.log(`📋 Remaining online users (${remainingOnline.length}):`, remainingOnline);
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io server ready`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };
