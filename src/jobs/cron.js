const cron = require('node-cron');
const { config, logger } = require('../config');
const { Token, Order, Product, User } = require('../models');

/**
 * Cleanup expired tokens
 * Runs daily at midnight
 */
const cleanupExpiredTokens = async () => {
  try {
    const result = await Token.deleteMany({
      expires: { $lt: new Date() },
    });
    logger.info(`Cleanup job: Deleted ${result.deletedCount} expired tokens`);
  } catch (error) {
    logger.error('Cleanup job failed:', error);
  }
};

/**
 * Generate daily sales report
 * Runs daily at 9 AM
 */
const generateDailySalesReport = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, stats] = await Promise.all([
      Order.find({
        createdAt: { $gte: yesterday, $lt: today },
        status: { $nin: ['cancelled', 'refunded'] },
      }),
      Order.getStats(yesterday, today),
    ]);

    const report = {
      date: yesterday.toISOString().split('T')[0],
      totalOrders: orders.length,
      totalRevenue: stats[0]?.totalRevenue || 0,
      averageOrderValue: stats[0]?.averageOrderValue || 0,
    };

    logger.info('Daily Sales Report:', report);

    // Here you could send the report via email
    // await emailService.sendDailyReport(report);
  } catch (error) {
    logger.error('Daily report job failed:', error);
  }
};

/**
 * Check for low stock products
 * Runs every 15 minutes
 */
const checkLowStock = async () => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      quantity: { $gt: 0 },
      status: 'active',
    }).select('name quantity lowStockThreshold');

    if (lowStockProducts.length > 0) {
      logger.warn(`Low stock alert: ${lowStockProducts.length} products are low on stock`);
      // Here you could send alerts
      // await emailService.sendLowStockAlert(lowStockProducts);
    }
  } catch (error) {
    logger.error('Low stock check job failed:', error);
  }
};

/**
 * Sync data with external services
 * Runs every 15 minutes
 */
const syncExternalData = async () => {
  try {
    // Example: Sync with external inventory system
    // const response = await axios.get('https://external-api.com/inventory');
    // await Product.bulkWrite(updates);

    logger.info('External data sync completed');
  } catch (error) {
    logger.error('External sync job failed:', error);
  }
};

/**
 * Clean up inactive user sessions
 * Runs weekly on Monday at 1 AM
 */
const cleanupInactiveSessions = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Token.deleteMany({
      type: 'refresh',
      createdAt: { $lt: thirtyDaysAgo },
    });

    logger.info(`Session cleanup: Deleted ${result.deletedCount} inactive sessions`);
  } catch (error) {
    logger.error('Session cleanup job failed:', error);
  }
};

/**
 * Generate weekly analytics
 * Runs every Monday at 9 AM
 */
const generateWeeklyAnalytics = async () => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [userStats, productStats, orderStats] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: null, newUsers: { $sum: 1 } } },
      ]),
      Product.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: null, newProducts: { $sum: 1 }, totalViews: { $sum: '$views' } } },
      ]),
      Order.getStats(weekAgo, new Date()),
    ]);

    const analytics = {
      period: `${weekAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
      newUsers: userStats[0]?.newUsers || 0,
      newProducts: productStats[0]?.newProducts || 0,
      productViews: productStats[0]?.totalViews || 0,
      orders: orderStats[0]?.totalOrders || 0,
      revenue: orderStats[0]?.totalRevenue || 0,
    };

    logger.info('Weekly Analytics:', analytics);
  } catch (error) {
    logger.error('Weekly analytics job failed:', error);
  }
};

/**
 * Archive old orders
 * Runs monthly on the 1st at 2 AM
 */
const archiveOldOrders = async () => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Here you would typically move old orders to an archive collection
    const oldOrders = await Order.countDocuments({
      createdAt: { $lt: sixMonthsAgo },
      status: { $in: ['delivered', 'cancelled', 'refunded'] },
    });

    logger.info(`Archive check: ${oldOrders} orders eligible for archiving`);
  } catch (error) {
    logger.error('Archive job failed:', error);
  }
};

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
  if (!config.cron.enabled) {
    logger.info('Cron jobs are disabled');
    return;
  }

  logger.info('Initializing cron jobs...');

  // Cleanup expired tokens - Daily at midnight
  cron.schedule(config.cron.cleanupSchedule, cleanupExpiredTokens, {
    scheduled: true,
    timezone: 'UTC',
  });
  logger.info(`Scheduled: Token cleanup (${config.cron.cleanupSchedule})`);

  // Daily sales report - Daily at 9 AM
  cron.schedule('0 9 * * *', generateDailySalesReport, {
    scheduled: true,
    timezone: 'UTC',
  });
  logger.info('Scheduled: Daily sales report (0 9 * * *)');

  // Check low stock - Every 15 minutes
  cron.schedule(config.cron.syncSchedule, checkLowStock, {
    scheduled: true,
    timezone: 'UTC',
  });
  logger.info(`Scheduled: Low stock check (${config.cron.syncSchedule})`);

  // Sync external data - Every 15 minutes
  cron.schedule(config.cron.syncSchedule, syncExternalData, {
    scheduled: true,
    timezone: 'UTC',
  });
  logger.info(`Scheduled: External data sync (${config.cron.syncSchedule})`);

  // Weekly analytics - Every Monday at 9 AM
  cron.schedule(config.cron.reportSchedule, generateWeeklyAnalytics, {
    scheduled: true,
    timezone: 'UTC',
  });
  logger.info(`Scheduled: Weekly analytics (${config.cron.reportSchedule})`);

  // Cleanup inactive sessions - Every Monday at 1 AM
  cron.schedule('0 1 * * 1', cleanupInactiveSessions, {
    scheduled: true,
    timezone: 'UTC',
  });
  logger.info('Scheduled: Session cleanup (0 1 * * 1)');

  // Archive old orders - Monthly on the 1st at 2 AM
  cron.schedule('0 2 1 * *', archiveOldOrders, {
    scheduled: true,
    timezone: 'UTC',
  });
  logger.info('Scheduled: Archive old orders (0 2 1 * *)');

  logger.info('All cron jobs initialized successfully');
};

module.exports = {
  initCronJobs,
  // Export individual jobs for testing
  cleanupExpiredTokens,
  generateDailySalesReport,
  checkLowStock,
  syncExternalData,
  cleanupInactiveSessions,
  generateWeeklyAnalytics,
  archiveOldOrders,
};
