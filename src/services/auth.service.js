const { User, Token, tokenTypes } = require('../models');
const tokenService = require('./token.service');
const emailService = require('./email.service');
const { UnauthorizedError, BadRequestError, NotFoundError, ConflictError } = require('../utils');
const { logger } = require('../config');

/**
 * Register a new user
 * @param {Object} userBody - User registration data
 * @returns {Promise<User>} - Created user
 */
const register = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ConflictError('Email already taken');
  }

  const user = await User.create(userBody);

  // Send verification email
  try {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user.id);
    await emailService.sendVerificationEmail(user.email, verifyEmailToken);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
  }

  return user;
};

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<User>} - Authenticated user
 */
const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Your account has been deactivated');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return user;
};

/**
 * Logout user by blacklisting refresh token
 * @param {string} refreshToken - Refresh token
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });

  if (!refreshTokenDoc) {
    throw new NotFoundError('Token not found');
  }

  await refreshTokenDoc.deleteOne();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} - New auth tokens
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await User.findById(refreshTokenDoc.user);

    if (!user) {
      throw new Error();
    }

    // Delete old refresh token
    await refreshTokenDoc.deleteOne();

    // Generate new tokens
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new UnauthorizedError('Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken - Reset password token
 * @param {string} newPassword - New password
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(
      resetPasswordToken,
      tokenTypes.RESET_PASSWORD
    );

    const user = await User.findById(resetPasswordTokenDoc.user);
    if (!user) {
      throw new Error();
    }

    user.password = newPassword;
    await user.save();

    // Delete all reset password tokens for this user
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });

    // Optionally: Delete all refresh tokens to force re-login
    await Token.deleteMany({ user: user.id, type: tokenTypes.REFRESH });
  } catch (error) {
    throw new UnauthorizedError('Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken - Email verification token
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(
      verifyEmailToken,
      tokenTypes.VERIFY_EMAIL
    );

    const user = await User.findById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }

    // Delete verification tokens
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });

    // Update user
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
    }
  } catch (error) {
    throw new UnauthorizedError('Email verification failed');
  }
};

/**
 * Forgot password - send reset email
 * @param {string} email - User email
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return;
  }

  const resetPasswordToken = await tokenService.generateResetPasswordToken(user.id);
  await emailService.sendResetPasswordEmail(email, resetPasswordToken);
};

/**
 * Change password
 * @param {ObjectId} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');

  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new BadRequestError('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  // Delete all refresh tokens to force re-login on other devices
  await Token.deleteMany({ user: user.id, type: tokenTypes.REFRESH });
};

module.exports = {
  register,
  login,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  forgotPassword,
  changePassword,
};
