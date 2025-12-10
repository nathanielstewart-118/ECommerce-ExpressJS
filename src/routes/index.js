const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const webhookRoutes = require('./webhook.routes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/webhooks', webhookRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        logout: 'POST /api/v1/auth/logout',
        refreshTokens: 'POST /api/v1/auth/refresh-tokens',
        forgotPassword: 'POST /api/v1/auth/forgot-password',
        resetPassword: 'POST /api/v1/auth/reset-password',
        verifyEmail: 'POST /api/v1/auth/verify-email',
        changePassword: 'POST /api/v1/auth/change-password',
        me: 'GET /api/v1/auth/me',
      },
      users: {
        list: 'GET /api/v1/users',
        create: 'POST /api/v1/users',
        get: 'GET /api/v1/users/:userId',
        update: 'PATCH /api/v1/users/:userId',
        delete: 'DELETE /api/v1/users/:userId',
        stats: 'GET /api/v1/users/stats',
        search: 'GET /api/v1/users/search',
      },
      products: {
        list: 'GET /api/v1/products',
        create: 'POST /api/v1/products',
        get: 'GET /api/v1/products/:productId',
        update: 'PATCH /api/v1/products/:productId',
        delete: 'DELETE /api/v1/products/:productId',
        search: 'GET /api/v1/products/search',
        featured: 'GET /api/v1/products/featured',
        byCategory: 'GET /api/v1/products/category/:categoryId',
        stats: 'GET /api/v1/products/stats',
      },
      webhooks: {
        stripe: 'POST /api/v1/webhooks/stripe',
      },
    },
  });
});

module.exports = router;
