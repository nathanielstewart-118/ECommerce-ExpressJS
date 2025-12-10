const express = require('express');
const { productController } = require('../controllers');
const { auth, validate } = require('../middlewares');
const { productValidation } = require('../validations');

const router = express.Router();

/**
 * @route   GET /api/v1/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', validate(productValidation.getProducts), productController.getProducts);

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product
 * @access  Private/Admin
 */
router.post(
  '/',
  auth.verifyToken,
  auth.authorize('manageProducts'),
  validate(productValidation.createProduct),
  productController.createProduct
);

/**
 * @route   GET /api/v1/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured', productController.getFeaturedProducts);

/**
 * @route   GET /api/v1/products/search
 * @desc    Search products
 * @access  Public
 */
router.get('/search', productController.searchProducts);

/**
 * @route   GET /api/v1/products/stats
 * @desc    Get product statistics
 * @access  Private/Admin
 */
router.get(
  '/stats',
  auth.verifyToken,
  auth.authorize('viewAnalytics'),
  productController.getProductStats
);

/**
 * @route   GET /api/v1/products/low-stock
 * @desc    Get low stock products
 * @access  Private/Admin
 */
router.get(
  '/low-stock',
  auth.verifyToken,
  auth.authorize('manageProducts'),
  productController.getLowStockProducts
);

/**
 * @route   GET /api/v1/products/category/:categoryId
 * @desc    Get products by category
 * @access  Public
 */
router.get('/category/:categoryId', productController.getProductsByCategory);

/**
 * @route   GET /api/v1/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get('/slug/:slug', productController.getProductBySlug);

/**
 * @route   POST /api/v1/products/generate-description
 * @desc    Generate AI product description
 * @access  Private/Admin
 */
router.post(
  '/generate-description',
  auth.verifyToken,
  auth.authorize('manageProducts'),
  productController.generateDescription
);

/**
 * @route   GET /api/v1/products/:productId
 * @desc    Get product by ID
 * @access  Public
 */
router.get(
  '/:productId',
  validate(productValidation.getProduct),
  productController.getProduct
);

/**
 * @route   PATCH /api/v1/products/:productId
 * @desc    Update product
 * @access  Private/Admin
 */
router.patch(
  '/:productId',
  auth.verifyToken,
  auth.authorize('manageProducts'),
  validate(productValidation.updateProduct),
  productController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:productId
 * @desc    Delete product
 * @access  Private/Admin
 */
router.delete(
  '/:productId',
  auth.verifyToken,
  auth.authorize('manageProducts'),
  validate(productValidation.deleteProduct),
  productController.deleteProduct
);

/**
 * @route   GET /api/v1/products/:productId/related
 * @desc    Get related products
 * @access  Public
 */
router.get('/:productId/related', productController.getRelatedProducts);

module.exports = router;
