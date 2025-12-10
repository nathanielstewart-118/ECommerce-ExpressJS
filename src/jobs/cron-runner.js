/**
 * Standalone Cron Runner
 * 
 * This file runs as a separate PM2 process to handle cron jobs
 * without duplicating them across cluster instances.
 */

require('dotenv').config();
const { connectDB, logger } = require('../config');
const { initCronJobs } = require('./cron');

const startCronRunner = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Cron Runner: Connected to MongoDB');

    // Initialize cron jobs
    initCronJobs();
    logger.info('Cron Runner: All cron jobs initialized');

    // Keep the process running
    logger.info('Cron Runner: Process started and running...');
  } catch (error) {
    logger.error('Cron Runner: Failed to start:', error);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => {
  logger.info('Cron Runner: SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Cron Runner: SIGINT received, shutting down...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Cron Runner: Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Cron Runner: Unhandled Rejection:', reason);
  process.exit(1);
});

// Start the cron runner
startCronRunner();
