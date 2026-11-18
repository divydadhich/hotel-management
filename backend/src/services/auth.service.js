const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const BusinessSettings = require('../models/BusinessSettings.model');
const { ROLES } = require('../constants/roles');

const generateTokenPair = (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  return { accessToken, refreshToken };
};

const register = async ({ name, email, password, role, tenantId = null, phone }) => {
  const existing = await User.findOne({ tenantId, email });
  if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role, tenantId, phone });

  // Create default BusinessSettings if owner
  if (role === ROLES.OWNER && tenantId) {
    const existing = await BusinessSettings.findOne({ tenantId });
    if (!existing) {
      await BusinessSettings.create({ tenantId });
    }
  }

  return user;
};

const login = async ({ email, password, tenantId = null }) => {
  const input = (email || '').toLowerCase().trim();
  if (!input) {
    throw Object.assign(new Error('Email or username is required'), { statusCode: 400 });
  }

  const query = { email: input };
  if (tenantId) {
    query.tenantId = tenantId;
  }

  let user = await User.findOne(query);

  // If not found by exact email, allow shorthand role or prefix (e.g. 'owner', 'admin', 'kitchen', 'reception')
  if (!user) {
    const roleMap = {
      admin: ROLES.SUPER_ADMIN,
      superadmin: ROLES.SUPER_ADMIN,
      super_admin: ROLES.SUPER_ADMIN,
      owner: ROLES.OWNER,
      reception: ROLES.RECEPTIONIST,
      receptionist: ROLES.RECEPTIONIST,
      kitchen: ROLES.KITCHEN,
    };
    const targetRole = roleMap[input];
    if (targetRole) {
      const roleQuery = { role: targetRole };
      if (tenantId) roleQuery.tenantId = tenantId;
      user = await User.findOne(roleQuery);
    }
  }

  // Also check email prefix if user typed just the username portion (e.g. 'owner' for 'owner@royalpalace.com')
  if (!user && !input.includes('@')) {
    const escapedInput = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixQuery = { email: { $regex: new RegExp(`^${escapedInput}@`, 'i') } };
    if (tenantId) prefixQuery.tenantId = tenantId;
    user = await User.findOne(prefixQuery);
  }

  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  if (!user.isActive) throw Object.assign(new Error('Your account is deactivated'), { statusCode: 403 });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  user.lastLogin = new Date();
  const { accessToken, refreshToken } = generateTokenPair(user);
  await user.addRefreshToken(refreshToken);

  return { user, accessToken, refreshToken };
};

const refreshTokens = async (token) => {
  const jwt = require('jsonwebtoken');
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'hotel_saas_default_jwt_refresh_secret_32_characters');

  const user = await User.findById(decoded.userId);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 401 });

  // Check if token hash exists
  let valid = false;
  for (const rt of user.refreshTokens) {
    const bcrypt = require('bcryptjs');
    if (rt.expiresAt > new Date() && await bcrypt.compare(token, rt.tokenHash)) {
      valid = true;
      break;
    }
  }
  if (!valid) throw Object.assign(new Error('Refresh token is invalid or expired'), { statusCode: 401 });

  // Rotate tokens
  await user.removeRefreshToken(token);
  const { accessToken, refreshToken: newRefresh } = generateTokenPair(user);
  await user.addRefreshToken(newRefresh);

  return { user, accessToken, refreshToken: newRefresh };
};

const logout = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (user && refreshToken) {
    await user.removeRefreshToken(refreshToken);
  }
};

module.exports = { register, login, refreshTokens, logout, generateTokenPair };
