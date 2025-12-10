const express = require('express');
const { userController } = require('../controllers');
const { auth, validate } = require('../middlewares');
const { userValidation } = require('../validations');

const router = express.Router();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get(
  '/',
  auth.verifyToken,
  auth.authorize('getUsers'),
  validate(userValidation.getUsers),
  userController.getUsers
);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user
 * @access  Private/Admin
 */
router.post(
  '/',
  auth.verifyToken,
  auth.authorize('manageUsers'),
  validate(userValidation.createUser),
  userController.createUser
);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private/Admin
 */
router.get(
  '/stats',
  auth.verifyToken,
  auth.authorize('viewAnalytics'),
  userController.getUserStats
);

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users
 * @access  Private/Admin
 */
router.get(
  '/search',
  auth.verifyToken,
  auth.authorize('getUsers'),
  userController.searchUsers
);

/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get(
  '/:userId',
  auth.verifyToken,
  auth.authorize('getUsers'),
  validate(userValidation.getUser),
  userController.getUser
);

/**
 * @route   PATCH /api/v1/users/:userId
 * @desc    Update user by ID
 * @access  Private/Admin
 */
router.patch(
  '/:userId',
  auth.verifyToken,
  auth.authorize('manageUsers'),
  validate(userValidation.updateUser),
  userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:userId
 * @desc    Delete user by ID
 * @access  Private/Admin
 */
router.delete(
  '/:userId',
  auth.verifyToken,
  auth.authorize('manageUsers'),
  validate(userValidation.deleteUser),
  userController.deleteUser
);

/**
 * @route   POST /api/v1/users/:userId/deactivate
 * @desc    Deactivate user
 * @access  Private/Admin
 */
router.post(
  '/:userId/deactivate',
  auth.verifyToken,
  auth.authorize('manageUsers'),
  validate(userValidation.getUser),
  userController.deactivateUser
);

/**
 * @route   POST /api/v1/users/:userId/activate
 * @desc    Activate user
 * @access  Private/Admin
 */
router.post(
  '/:userId/activate',
  auth.verifyToken,
  auth.authorize('manageUsers'),
  validate(userValidation.getUser),
  userController.activateUser
);

module.exports = router;
