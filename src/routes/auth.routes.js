const express = require('express');
const { authController } = require('../controllers');
const { auth, validate, rateLimiter } = require('../middlewares');
const { authValidation } = require('../validations');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  rateLimiter.authLimiter,
  validate(authValidation.register),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  rateLimiter.authLimiter,
  validate(authValidation.login),
  authController.login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/v1/auth/refresh-tokens
 * @desc    Refresh auth tokens
 * @access  Public
 */
router.post(
  '/refresh-tokens',
  validate(authValidation.refreshTokens),
  authController.refreshTokens
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  rateLimiter.passwordResetLimiter,
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email',
  validate(authValidation.verifyEmail),
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/send-verification-email
 * @desc    Resend verification email
 * @access  Private
 */
router.post(
  '/send-verification-email',
  auth.verifyToken,
  rateLimiter.emailVerificationLimiter,
  authController.sendVerificationEmail
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  auth.verifyToken,
  validate(authValidation.changePassword),
  authController.changePassword
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', auth.verifyToken, authController.getMe);

/**
 * @route   PATCH /api/v1/auth/me
 * @desc    Update current user
 * @access  Private
 */
router.patch('/me', auth.verifyToken, authController.updateMe);

module.exports = router;
