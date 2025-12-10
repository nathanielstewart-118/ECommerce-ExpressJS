const { catchAsync } = require('../utils');
const { productService, openaiService } = require('../services');
const { helpers } = require('../utils');

/**
 * Create a product
 */
const createProduct = catchAsync(async (req, res) => {
  const productData = {
    ...req.body,
    createdBy: req.user.id,
  };

  const product = await productService.createProduct(productData);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product },
  });
});

/**
 * Get all products with filtering
 */
const getProducts = catchAsync(async (req, res) => {
  const filter = {};

  // Build filter from query params
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.isPublished !== undefined) filter.isPublished = req.query.isPublished === 'true';
  if (req.query.isFeatured !== undefined) filter.isFeatured = req.query.isFeatured === 'true';

  // Price range
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
  }

  const options = helpers.getPaginationOptions(req.query);
  const result = await productService.getProducts(filter, options);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get product by ID
 */
const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.productId);

  // Increment views (fire and forget)
  productService.incrementViews(req.params.productId).catch(() => {});

  res.json({
    success: true,
    data: { product },
  });
});

/**
 * Get product by slug
 */
const getProductBySlug = catchAsync(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);

  // Increment views (fire and forget)
  productService.incrementViews(product.id).catch(() => {});

  res.json({
    success: true,
    data: { product },
  });
});

/**
 * Update product
 */
const updateProduct = catchAsync(async (req, res) => {
  const updateData = {
    ...req.body,
    updatedBy: req.user.id,
  };

  const product = await productService.updateProductById(req.params.productId, updateData);

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product },
  });
});

/**
 * Delete product
 */
const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProductById(req.params.productId);

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

/**
 * Search products
 */
const searchProducts = catchAsync(async (req, res) => {
  const { q, ...queryOptions } = req.query;
  const options = helpers.getPaginationOptions(queryOptions);

  const result = await productService.searchProducts(q, options);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get products by category
 */
const getProductsByCategory = catchAsync(async (req, res) => {
  const options = helpers.getPaginationOptions(req.query);
  const result = await productService.getProductsByCategory(req.params.categoryId, options);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get featured products
 */
const getFeaturedProducts = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const products = await productService.getFeaturedProducts(limit);

  res.json({
    success: true,
    data: { products },
  });
});

/**
 * Get related products
 */
const getRelatedProducts = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 4;
  const products = await productService.getRelatedProducts(req.params.productId, limit);

  res.json({
    success: true,
    data: { products },
  });
});

/**
 * Get low stock products (admin only)
 */
const getLowStockProducts = catchAsync(async (req, res) => {
  const products = await productService.getLowStockProducts();

  res.json({
    success: true,
    data: { products },
  });
});

/**
 * Get product statistics (admin only)
 */
const getProductStats = catchAsync(async (req, res) => {
  const stats = await productService.getProductStats();

  res.json({
    success: true,
    data: { stats },
  });
});

/**
 * Generate AI product description
 */
const generateDescription = catchAsync(async (req, res) => {
  const { name, category, features, targetAudience } = req.body;

  const description = await openaiService.generateProductDescription({
    name,
    category,
    features,
    targetAudience,
  });

  res.json({
    success: true,
    data: { description },
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getRelatedProducts,
  getLowStockProducts,
  getProductStats,
  generateDescription,
};
