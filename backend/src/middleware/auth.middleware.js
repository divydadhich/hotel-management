const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header first, then cookie
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return ApiResponse.error(res, 'Access token required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hotel_saas_default_jwt_secret_32_characters_long_key');

    const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens').lean();
    if (!user) return ApiResponse.error(res, 'User not found', 401);
    if (!user.isActive) return ApiResponse.error(res, 'Your account is deactivated', 403);

    req.user = {
      userId: user._id.toString(),
      tenantId: user.tenantId ? user.tenantId.toString() : null,
      role: user.role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Access token expired', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return ApiResponse.error(res, 'Invalid access token', 401);
    }
    next(err);
  }
};

const authenticateRefresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return ApiResponse.error(res, 'Refresh token required', 401);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'hotel_saas_default_jwt_refresh_secret_32_characters');
    req.refreshTokenData = { userId: decoded.userId, token };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Refresh token expired. Please login again.', 401);
    }
    return ApiResponse.error(res, 'Invalid refresh token', 401);
  }
};

module.exports = { authenticate, authenticateRefresh };
