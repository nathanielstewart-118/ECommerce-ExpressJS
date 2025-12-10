const { catchAsync } = require('../utils');
const { authService, tokenService, userService } = require('../services');
const { config } = require('../config');

/**
 * Register a new user
 */
const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  const tokens = await tokenService.generateAuthTokens(user);

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', tokens.refresh.token, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    expires: tokens.refresh.expires,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: {
      user,
      tokens: {
        access: tokens.access,
      },
    },
  });
});

/**
 * Login user
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', tokens.refresh.token, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    expires: tokens.refresh.expires,
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      tokens: {
        access: tokens.access,
      },
    },
  });
});

/**
 * Logout user
 */
const logout = catchAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Refresh auth tokens
 */
const refreshTokens = catchAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
  const tokens = await authService.refreshAuth(refreshToken);

  // Update refresh token cookie
  res.cookie('refreshToken', tokens.refresh.token, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    expires: tokens.refresh.expires,
  });

  res.json({
    success: true,
    data: {
      tokens: {
        access: tokens.access,
      },
    },
  });
});

/**
 * Forgot password - send reset email
 */
const forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
});

/**
 * Reset password
 */
const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);

  res.json({
    success: true,
    message: 'Password reset successful. You can now log in with your new password.',
  });
});

/**
 * Verify email
 */
const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

/**
 * Send verification email
 */
const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user.id);
  const emailService = require('../services/email.service');
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);

  res.json({
    success: true,
    message: 'Verification email sent',
  });
});

/**
 * Change password
 */
const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * Get current user
 */
const getMe = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);

  res.json({
    success: true,
    data: { user },
  });
});

/**
 * Update current user
 */
const updateMe = catchAsync(async (req, res) => {
  // Prevent updating sensitive fields
  const { password, role, isActive, isEmailVerified, ...updateData } = req.body;
  const user = await userService.updateUserById(req.user.id, updateData);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  sendVerificationEmail,
  changePassword,
  getMe,
  updateMe,
};
