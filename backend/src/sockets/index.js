const { Server } = require('socket.io');
const logger = require('../utils/logger');
let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);

    socket.on('join:tenant', (tenantId) => {
      socket.join(`tenant:${tenantId}`);
      logger.info(`Socket ${socket.id} joined tenant room: ${tenantId}`);
    });

    socket.on('join:kitchen', (tenantId) => {
      socket.join(`kitchen:${tenantId}`);
      logger.info(`Socket ${socket.id} joined kitchen room: ${tenantId}`);
    });

    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
      logger.info(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    // Return dummy emitter if not yet initialized so calls don't crash
    return {
      to: () => ({ emit: () => {} }),
      emit: () => {},
    };
  }
  return io;
};

module.exports = { initSocket, getIO };
