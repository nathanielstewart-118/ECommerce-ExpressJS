const jwt = require('jsonwebtoken');
const { config, logger } = require('../config');
const { User } = require('../models');
const { UnauthorizedError, ForbiddenError } = require('../utils');
const { roleRights } = require('../config/roles');

/**
 * Verify JWT token and attach user to request
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('Access denied. No token provided.');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if user still exists
    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedError('The user belonging to this token no longer exists.');
    }

    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new UnauthorizedError('User recently changed password. Please log in again.');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated.');
    }

    // Grant access
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired.'));
    }
    next(error);
  }
};

/**
 * Check if user has required permissions
 * @param  {...string} requiredRights - Required permissions
 */
const authorize = (...requiredRights) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Please authenticate first.'));
    }

    if (requiredRights.length === 0) {
      return next();
    }

    const userRights = roleRights.get(req.user.role);
    const hasRequiredRights = requiredRights.every((right) => userRights.includes(right));

    if (!hasRequiredRights && req.params.userId !== req.user.id) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.sub);
      if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

/**
 * Require verified email
 */
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(new ForbiddenError('Please verify your email to access this resource.'));
  }
  next();
};

module.exports = {
  verifyToken,
  authorize,
  optionalAuth,
  requireVerifiedEmail,
  // Alias for common use
  auth: verifyToken,
  protect: verifyToken,
};
