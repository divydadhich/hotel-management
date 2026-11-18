
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.error('MONGODB_URI is missing from environment variables');
    process.exit(1);
  }

  let retries = 5;

  while (retries) {
    try {
      await mongoose.connect(mongoUri);

      logger.info(`MongoDB connected: ${mongoose.connection.host}`);
      logger.info(`Database name: ${mongoose.connection.name}`);

      break;
    } catch (err) {
      logger.error(
        `MongoDB connection error: ${err.message}. Retries left: ${retries - 1}`
      );

      retries -= 1;

      if (retries === 0) {
        logger.error('Could not connect to MongoDB. Exiting...');
        process.exit(1);
      }

      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

module.exports = { connectDB };
