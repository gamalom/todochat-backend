import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const connectedUsers = new Map();

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`⚡ User connected: ${socket.user.username}`);

    socket.join(userId);
    connectedUsers.set(userId, socket.id);

    socket.broadcast.emit('user_online', { userId, username: socket.user.username });
    socket.emit('online_users', Array.from(connectedUsers.keys()));

    socket.on('send_message', (data) => {
      io.to(data.receiverId).emit('receive_message', {
        ...data,
        senderId: userId,
        timestamp: new Date()
      });
    });

    socket.on('typing_start', (data) => {
      io.to(data.receiverId).emit('user_typing', { userId });
    });

    socket.on('typing_stop', (data) => {
      io.to(data.receiverId).emit('user_stopped_typing', { userId });
    });

    socket.on('disconnect', () => {
      console.log(`👋 User disconnected: ${socket.user.username}`);
      connectedUsers.delete(userId);
      socket.broadcast.emit('user_offline', { userId });
    });
  });

  return io;
};

export default { initializeSocket };
