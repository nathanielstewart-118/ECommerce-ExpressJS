const mongoose = require('mongoose');
const { config, logger } = require('../config');
const { ApiError } = require('../utils');

/**
 * Convert error to ApiError if not already
 */
const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error instanceof mongoose.Error ? 400 : 500);
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

/**
 * Handle specific error types
 */
const handleMongooseError = (error) => {
  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new ApiError(409, `${field} already exists`);
  }

  // Validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((e) => e.message);
    return new ApiError(400, messages.join('. '));
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return new ApiError(400, `Invalid ${error.path}: ${error.value}`);
  }

  return error;
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Handle specific MongoDB/Mongoose errors
  if (err instanceof mongoose.Error || err.code === 11000) {
    const handledError = handleMongooseError(err);
    statusCode = handledError.statusCode;
    message = handledError.message;
  }

  // Set defaults
  statusCode = statusCode || 500;
  message = message || 'Internal server error';

  // In production, don't leak error details for non-operational errors
  if (config.env === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal server error';
  }

  // Log error
  const logMessage = `${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`;

  if (statusCode >= 500) {
    logger.error(logMessage, { stack: err.stack });
  } else {
    logger.warn(logMessage);
  }

  // Send response
  const response = {
    success: false,
    status: statusCode,
    message,
    ...(config.env === 'development' && {
      stack: err.stack,
      error: err,
    }),
  };

  // Add validation errors if present
  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle 404 Not Found
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  errorConverter,
  errorHandler,
  notFound,
};
