const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { errorHandler, notFound } = require('./middleware/errorHandler.middleware');
const logger = require('./utils/logger');
const v1Routes = require('./routes/v1/index');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET || 'hotel_saas_cookie_secret_xyz'));

// Sanitize MongoDB queries against NoSQL injection (Express 5 compatible)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// HTTP logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// Rate limiting
app.use('/api', apiLimiter);

// API v1 routes
app.use('/api/v1', v1Routes);

// 404 handler
app.use(notFound);

// Global centralized error handler
app.use(errorHandler);

module.exports = app;
