const { catchAsync } = require('../utils');
const { userService } = require('../services');
const { helpers } = require('../utils');

/**
 * Create a user (admin only)
 */
const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user },
  });
});

/**
 * Get all users with pagination
 */
const getUsers = catchAsync(async (req, res) => {
  const filter = helpers.pick(req.query, ['name', 'email', 'role', 'isActive']);
  const options = helpers.getPaginationOptions(req.query);

  // Convert string to boolean if present
  if (filter.isActive !== undefined) {
    filter.isActive = filter.isActive === 'true';
  }

  const result = await userService.getUsers(filter, options);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get user by ID
 */
const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);

  res.json({
    success: true,
    data: { user },
  });
});

/**
 * Update user by ID
 */
const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
});

/**
 * Delete user by ID
 */
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * Deactivate user
 */
const deactivateUser = catchAsync(async (req, res) => {
  const user = await userService.deactivateUser(req.params.userId);

  res.json({
    success: true,
    message: 'User deactivated successfully',
    data: { user },
  });
});

/**
 * Activate user
 */
const activateUser = catchAsync(async (req, res) => {
  const user = await userService.activateUser(req.params.userId);

  res.json({
    success: true,
    message: 'User activated successfully',
    data: { user },
  });
});

/**
 * Search users
 */
const searchUsers = catchAsync(async (req, res) => {
  const { q, ...queryOptions } = req.query;
  const options = helpers.getPaginationOptions(queryOptions);

  const result = await userService.searchUsers(q, options);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get user statistics (admin only)
 */
const getUserStats = catchAsync(async (req, res) => {
  const stats = await userService.getUserStats();

  res.json({
    success: true,
    data: { stats },
  });
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  searchUsers,
  getUserStats,
};
