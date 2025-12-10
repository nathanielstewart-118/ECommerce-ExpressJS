const { Product } = require('../models');
const { NotFoundError } = require('../utils');

/**
 * Create a new product
 * @param {Object} productBody - Product data
 * @returns {Promise<Product>} - Created product
 */
const createProduct = async (productBody) => {
  const product = await Product.create(productBody);
  return product;
};

/**
 * Get all products with pagination and filtering
 * @param {Object} filter - MongoDB filter
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Paginated products
 */
const getProducts = async (filter = {}, options = {}) => {
  const { sortBy = 'createdAt', order = 'desc', page = 1, limit = 10, populate } = options;

  return Product.paginate(filter, {
    sortBy,
    order,
    page,
    limit,
    populate: populate || 'category createdBy',
  });
};

/**
 * Get product by ID
 * @param {ObjectId} id - Product ID
 * @returns {Promise<Product>} - Product object
 */
const getProductById = async (id) => {
  const product = await Product.findById(id).populate('category createdBy');
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  return product;
};

/**
 * Get product by slug
 * @param {string} slug - Product slug
 * @returns {Promise<Product>} - Product object
 */
const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug }).populate('category createdBy');
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  return product;
};

/**
 * Update product by ID
 * @param {ObjectId} productId - Product ID
 * @param {Object} updateBody - Update data
 * @returns {Promise<Product>} - Updated product
 */
const updateProductById = async (productId, updateBody) => {
  const product = await getProductById(productId);
  Object.assign(product, updateBody);
  await product.save();
  return product;
};

/**
 * Delete product by ID
 * @param {ObjectId} productId - Product ID
 * @returns {Promise<Product>} - Deleted product
 */
const deleteProductById = async (productId) => {
  const product = await getProductById(productId);
  await product.deleteOne();
  return product;
};

/**
 * Search products
 * @param {string} query - Search query
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Search results
 */
const searchProducts = async (query, options = {}) => {
  const filter = {
    $text: { $search: query },
    isPublished: true,
    status: 'active',
  };

  return getProducts(filter, options);
};

/**
 * Get products by category
 * @param {ObjectId} categoryId - Category ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Products in category
 */
const getProductsByCategory = async (categoryId, options = {}) => {
  const filter = {
    category: categoryId,
    isPublished: true,
    status: 'active',
  };

  return getProducts(filter, options);
};

/**
 * Get featured products
 * @param {number} limit - Number of products to return
 * @returns {Promise<Array>} - Featured products
 */
const getFeaturedProducts = async (limit = 10) => {
  return Product.find({
    isFeatured: true,
    isPublished: true,
    status: 'active',
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category');
};

/**
 * Get related products
 * @param {ObjectId} productId - Product ID
 * @param {number} limit - Number of products to return
 * @returns {Promise<Array>} - Related products
 */
const getRelatedProducts = async (productId, limit = 4) => {
  const product = await getProductById(productId);

  return Product.find({
    _id: { $ne: productId },
    category: product.category,
    isPublished: true,
    status: 'active',
  })
    .sort({ 'ratings.average': -1 })
    .limit(limit)
    .populate('category');
};

/**
 * Update product stock
 * @param {ObjectId} productId - Product ID
 * @param {number} quantity - Quantity to add/subtract
 * @param {string} operation - 'add' or 'subtract'
 * @returns {Promise<Product>} - Updated product
 */
const updateStock = async (productId, quantity, operation = 'subtract') => {
  const product = await getProductById(productId);

  if (operation === 'subtract') {
    if (product.quantity < quantity) {
      throw new Error('Insufficient stock');
    }
    product.quantity -= quantity;
    product.soldCount += quantity;
  } else {
    product.quantity += quantity;
  }

  await product.save();
  return product;
};

/**
 * Increment product views
 * @param {ObjectId} productId - Product ID
 */
const incrementViews = async (productId) => {
  await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });
};

/**
 * Get low stock products
 * @returns {Promise<Array>} - Low stock products
 */
const getLowStockProducts = async () => {
  return Product.find({
    $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    quantity: { $gt: 0 },
    status: 'active',
  }).populate('category');
};

/**
 * Get out of stock products
 * @returns {Promise<Array>} - Out of stock products
 */
const getOutOfStockProducts = async () => {
  return Product.find({
    quantity: 0,
    status: 'active',
  }).populate('category');
};

/**
 * Get product statistics
 * @returns {Promise<Object>} - Product statistics
 */
const getProductStats = async () => {
  const [stats] = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        averagePrice: { $avg: '$price' },
        totalViews: { $sum: '$views' },
        totalSold: { $sum: '$soldCount' },
      },
    },
  ]);

  const byStatus = await Product.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    ...stats,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProductById,
  deleteProductById,
  searchProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getRelatedProducts,
  updateStock,
  incrementViews,
  getLowStockProducts,
  getOutOfStockProducts,
  getProductStats,
};
