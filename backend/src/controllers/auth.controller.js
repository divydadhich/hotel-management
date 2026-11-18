const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000,
};

const login = asyncHandler(async (req, res) => {
  const { email, password, tenantId } = req.body;
  if (!email || !password) return ApiResponse.error(res, 'Email and password are required', 400);

  const { user, accessToken, refreshToken } = await authService.login({ email, password, tenantId });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);

  return ApiResponse.success(res, {
    user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId, avatar: user.avatar },
    accessToken,
  }, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return ApiResponse.error(res, 'Refresh token required', 401);

  const { user, accessToken, refreshToken } = await authService.refreshTokens(token);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);

  return ApiResponse.success(res, { accessToken, user: { id: user._id, name: user.name, role: user.role, tenantId: user.tenantId } }, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  await authService.logout(req.user.userId, token);
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  return ApiResponse.success(res, null, 'Logged out successfully');
});

const getMe = asyncHandler(async (req, res) => {
  const User = require('../models/User.model');
  const user = await User.findById(req.user.userId).select('-passwordHash -refreshTokens').lean();
  if (!user) return ApiResponse.error(res, 'User not found', 404);
  return ApiResponse.success(res, { user }, 'User fetched');
});

module.exports = { login, refresh, logout, getMe };
