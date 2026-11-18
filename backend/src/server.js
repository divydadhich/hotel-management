const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./sockets/index');
const { startSubscriptionExpiryJob } = require('./jobs/subscriptionExpiry.job');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`🚀 Multi-Tenant Hotel & Restaurant SaaS Backend Started`);
      logger.info(`📡 Port: ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`🌐 API Endpoint: http://localhost:${PORT}/api/v1`);
      logger.info(`💓 Healthcheck:  http://localhost:${PORT}/api/v1/health`);
      logger.info(`=======================================================`);
    });

    startSubscriptionExpiryJob();

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      httpServer.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

startServer();
