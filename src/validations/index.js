const Joi = require('joi');

// Custom validators
const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid MongoDB ObjectId');
  }
  return value;
};

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message('password must contain at least 1 letter and 1 number');
  }
  return value;
};

// Auth validations
const authValidation = {
  register: {
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(50),
      email: Joi.string().required().email(),
      password: Joi.string().required().custom(password),
    }),
  },
  login: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
    }),
  },
  logout: {
    body: Joi.object().keys({
      refreshToken: Joi.string().required(),
    }),
  },
  refreshTokens: {
    body: Joi.object().keys({
      refreshToken: Joi.string().required(),
    }),
  },
  forgotPassword: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
    }),
  },
  resetPassword: {
    query: Joi.object().keys({
      token: Joi.string().required(),
    }),
    body: Joi.object().keys({
      password: Joi.string().required().custom(password),
    }),
  },
  verifyEmail: {
    query: Joi.object().keys({
      token: Joi.string().required(),
    }),
  },
  changePassword: {
    body: Joi.object().keys({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().required().custom(password),
    }),
  },
};

// User validations
const userValidation = {
  createUser: {
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(50),
      email: Joi.string().required().email(),
      password: Joi.string().required().custom(password),
      role: Joi.string().valid('user', 'admin', 'moderator'),
    }),
  },
  getUsers: {
    query: Joi.object().keys({
      name: Joi.string(),
      email: Joi.string(),
      role: Joi.string().valid('user', 'admin', 'moderator'),
      isActive: Joi.boolean(),
      sortBy: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
      limit: Joi.number().integer().min(1).max(100),
      page: Joi.number().integer().min(1),
    }),
  },
  getUser: {
    params: Joi.object().keys({
      userId: Joi.string().required().custom(objectId),
    }),
  },
  updateUser: {
    params: Joi.object().keys({
      userId: Joi.string().required().custom(objectId),
    }),
    body: Joi.object()
      .keys({
        name: Joi.string().min(2).max(50),
        email: Joi.string().email(),
        password: Joi.string().custom(password),
        role: Joi.string().valid('user', 'admin', 'moderator'),
        isActive: Joi.boolean(),
        phone: Joi.string().allow('', null),
        avatar: Joi.string().uri().allow('', null),
      })
      .min(1),
  },
  deleteUser: {
    params: Joi.object().keys({
      userId: Joi.string().required().custom(objectId),
    }),
  },
};

// Product validations
const productValidation = {
  createProduct: {
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(100),
      description: Joi.string().required().max(2000),
      shortDescription: Joi.string().max(500),
      price: Joi.number().required().min(0),
      compareAtPrice: Joi.number().min(0),
      costPrice: Joi.number().min(0),
      category: Joi.string().required().custom(objectId),
      subcategory: Joi.string().custom(objectId),
      brand: Joi.string().max(50),
      sku: Joi.string(),
      barcode: Joi.string(),
      quantity: Joi.number().integer().min(0).default(0),
      lowStockThreshold: Joi.number().integer().min(0).default(10),
      images: Joi.array().items(
        Joi.object().keys({
          url: Joi.string().required().uri(),
          alt: Joi.string(),
          isPrimary: Joi.boolean(),
        })
      ),
      specifications: Joi.array().items(
        Joi.object().keys({
          name: Joi.string().required(),
          value: Joi.string().required(),
        })
      ),
      tags: Joi.array().items(Joi.string()),
      status: Joi.string().valid('draft', 'active', 'archived'),
      isPublished: Joi.boolean(),
      isFeatured: Joi.boolean(),
      weight: Joi.object().keys({
        value: Joi.number(),
        unit: Joi.string().valid('kg', 'lb', 'g', 'oz'),
      }),
      dimensions: Joi.object().keys({
        length: Joi.number(),
        width: Joi.number(),
        height: Joi.number(),
        unit: Joi.string().valid('cm', 'in', 'm'),
      }),
      seo: Joi.object().keys({
        metaTitle: Joi.string().max(60),
        metaDescription: Joi.string().max(160),
        metaKeywords: Joi.array().items(Joi.string()),
      }),
    }),
  },
  getProducts: {
    query: Joi.object().keys({
      name: Joi.string(),
      category: Joi.string().custom(objectId),
      status: Joi.string().valid('draft', 'active', 'archived'),
      isPublished: Joi.boolean(),
      isFeatured: Joi.boolean(),
      minPrice: Joi.number().min(0),
      maxPrice: Joi.number().min(0),
      search: Joi.string(),
      sortBy: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
      limit: Joi.number().integer().min(1).max(100),
      page: Joi.number().integer().min(1),
    }),
  },
  getProduct: {
    params: Joi.object().keys({
      productId: Joi.string().required().custom(objectId),
    }),
  },
  updateProduct: {
    params: Joi.object().keys({
      productId: Joi.string().required().custom(objectId),
    }),
    body: Joi.object()
      .keys({
        name: Joi.string().min(2).max(100),
        description: Joi.string().max(2000),
        shortDescription: Joi.string().max(500),
        price: Joi.number().min(0),
        compareAtPrice: Joi.number().min(0).allow(null),
        costPrice: Joi.number().min(0).allow(null),
        category: Joi.string().custom(objectId),
        subcategory: Joi.string().custom(objectId).allow(null),
        brand: Joi.string().max(50).allow('', null),
        sku: Joi.string().allow('', null),
        barcode: Joi.string().allow('', null),
        quantity: Joi.number().integer().min(0),
        lowStockThreshold: Joi.number().integer().min(0),
        images: Joi.array().items(
          Joi.object().keys({
            url: Joi.string().required().uri(),
            alt: Joi.string(),
            isPrimary: Joi.boolean(),
          })
        ),
        specifications: Joi.array().items(
          Joi.object().keys({
            name: Joi.string().required(),
            value: Joi.string().required(),
          })
        ),
        tags: Joi.array().items(Joi.string()),
        status: Joi.string().valid('draft', 'active', 'archived'),
        isPublished: Joi.boolean(),
        isFeatured: Joi.boolean(),
      })
      .min(1),
  },
  deleteProduct: {
    params: Joi.object().keys({
      productId: Joi.string().required().custom(objectId),
    }),
  },
};

module.exports = {
  authValidation,
  userValidation,
  productValidation,
  objectId,
  password,
};
