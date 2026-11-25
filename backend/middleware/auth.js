const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable must be set in production');
    }
    return 'dev-only-insecure-fallback-secret-change-in-env';
  }
  return secret;
}

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Require a valid Bearer JWT and active user account.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Please log in.', 401);
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (err) {
    throw new AppError('Invalid or expired session token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('Account no longer exists.', 401);
  }
  if (!user.isActive) {
    throw new AppError('Your account has been suspended. Please contact the municipality administrator.', 403);
  }

  req.user = user;
  next();
});

/**
 * Optional authentication: populates req.user if a valid token is present, otherwise continues anonymously.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (_) {
    // Ignore invalid optional tokens on public routes
  }
  next();
});

/**
 * Restrict route access to specific user roles.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = { protect, optionalAuth, authorize, signToken, getJwtSecret };
