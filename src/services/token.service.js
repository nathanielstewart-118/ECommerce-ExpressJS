const jwt = require('jsonwebtoken');
const moment = require('moment');
const { config } = require('../config');
const { Token, tokenTypes } = require('../models');
const { UnauthorizedError } = require('../utils');

/**
 * Generate a JWT token
 * @param {ObjectId} userId - User ID
 * @param {Moment} expires - Expiration time
 * @param {string} type - Token type
 * @param {string} secret - JWT secret
 * @returns {string} - JWT token
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token to database
 * @param {string} token - JWT token
 * @param {ObjectId} userId - User ID
 * @param {Moment} expires - Expiration time
 * @param {string} type - Token type
 * @param {boolean} blacklisted - Is token blacklisted
 * @returns {Promise<Token>} - Saved token document
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify a token and return token doc
 * @param {string} token - JWT token
 * @param {string} type - Token type
 * @returns {Promise<Token>} - Token document
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  });

  if (!tokenDoc) {
    throw new UnauthorizedError('Token not found');
  }

  return tokenDoc;
};

/**
 * Generate auth tokens (access and refresh)
 * @param {User} user - User object
 * @returns {Promise<Object>} - Access and refresh tokens
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email - User email
 * @returns {Promise<string>} - Reset password token
 */
const generateResetPasswordToken = async (userId) => {
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(userId, expires, tokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken, userId, expires, tokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate email verification token
 * @param {ObjectId} userId - User ID
 * @returns {Promise<string>} - Email verification token
 */
const generateVerifyEmailToken = async (userId) => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(userId, expires, tokenTypes.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, userId, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

/**
 * Blacklist a token
 * @param {string} token - JWT token
 * @param {string} type - Token type
 */
const blacklistToken = async (token, type) => {
  await Token.findOneAndUpdate({ token, type }, { blacklisted: true });
};

/**
 * Delete tokens for a user
 * @param {ObjectId} userId - User ID
 * @param {string} type - Token type (optional)
 */
const deleteUserTokens = async (userId, type = null) => {
  const query = { user: userId };
  if (type) {
    query.type = type;
  }
  await Token.deleteMany(query);
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  blacklistToken,
  deleteUserTokens,
};
