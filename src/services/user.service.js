const { User } = require('../models');
const { NotFoundError, ConflictError } = require('../utils');
const stripeService = require('./stripe.service');
const { logger } = require('../config');

/**
 * Create a new user
 * @param {Object} userBody - User data
 * @returns {Promise<User>} - Created user
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ConflictError('Email already taken');
  }

  const user = await User.create(userBody);

  // Create Stripe customer if Stripe is configured
  if (stripeService.isConfigured()) {
    try {
      const customer = await stripeService.createCustomer({
        email: user.email,
        name: user.name,
        userId: user.id,
      });
      if (customer) {
        user.stripeCustomerId = customer.id;
        await user.save({ validateBeforeSave: false });
      }
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
    }
  }

  return user;
};

/**
 * Get all users with pagination
 * @param {Object} filter - MongoDB filter
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Paginated users
 */
const getUsers = async (filter, options) => {
  const { sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = options;

  const skip = (page - 1) * limit;
  const sortOrder = order === 'desc' ? -1 : 1;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-__v'),
    User.countDocuments(filter),
  ]);

  return {
    results: users,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalResults: total,
  };
};

/**
 * Get user by ID
 * @param {ObjectId} id - User ID
 * @returns {Promise<User>} - User object
 */
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<User>} - User object
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by ID
 * @param {ObjectId} userId - User ID
 * @param {Object} updateBody - Update data
 * @returns {Promise<User>} - Updated user
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);

  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ConflictError('Email already taken');
  }

  Object.assign(user, updateBody);
  await user.save();

  return user;
};

/**
 * Delete user by ID
 * @param {ObjectId} userId - User ID
 * @returns {Promise<User>} - Deleted user
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  await user.deleteOne();
  return user;
};

/**
 * Deactivate user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<User>} - Deactivated user
 */
const deactivateUser = async (userId) => {
  const user = await getUserById(userId);
  user.isActive = false;
  await user.save({ validateBeforeSave: false });
  return user;
};

/**
 * Activate user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<User>} - Activated user
 */
const activateUser = async (userId) => {
  const user = await getUserById(userId);
  user.isActive = true;
  await user.save({ validateBeforeSave: false });
  return user;
};

/**
 * Update user preferences
 * @param {ObjectId} userId - User ID
 * @param {Object} preferences - New preferences
 * @returns {Promise<User>} - Updated user
 */
const updatePreferences = async (userId, preferences) => {
  const user = await getUserById(userId);

  user.preferences = {
    ...user.preferences,
    ...preferences,
  };

  await user.save({ validateBeforeSave: false });
  return user;
};

/**
 * Search users
 * @param {string} query - Search query
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Search results
 */
const searchUsers = async (query, options = {}) => {
  const { page = 1, limit = 10 } = options;

  const filter = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ],
  };

  return getUsers(filter, { page, limit, ...options });
};

/**
 * Get user statistics
 * @returns {Promise<Object>} - User statistics
 */
const getUserStats = async () => {
  const [total, active, verified, byRole] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isEmailVerified: true }),
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    total,
    active,
    inactive: total - active,
    verified,
    unverified: total - verified,
    byRole: byRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  deactivateUser,
  activateUser,
  updatePreferences,
  searchUsers,
  getUserStats,
};
