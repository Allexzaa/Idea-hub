import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/auth.routes';
import ideaRoutes from './routes/idea.routes';
import commentRoutes from './routes/comment-standalone.routes';
import userRoutes from './routes/user.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import attachmentRoutes from './routes/attachment.routes';
import fundingRoutes from './routes/funding.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'IdeaNest API is running' });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to IdeaNest API 🪺' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/funding', fundingRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user-specific room for real-time messaging
  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Leave user-specific room
  socket.on('leave', (userId: string) => {
    socket.leave(`user:${userId}`);
    console.log(`User ${userId} left their room`);
  });

  // Typing indicator
  socket.on('typing', (data: { conversationId: string; userId: string }) => {
    socket.to(data.conversationId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🪺 IdeaNest API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, io };
