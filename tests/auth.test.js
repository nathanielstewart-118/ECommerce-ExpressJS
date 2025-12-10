const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('Auth Endpoints', () => {
  // Skip database tests if MongoDB is not available
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db';

  beforeAll(async () => {
    try {
      await mongoose.connect(mongoUri);
    } catch (error) {
      console.log('MongoDB not available, skipping database tests');
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      // Clean up test data
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    }
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('API is running');
    });
  });

  describe('GET /api/v1/', () => {
    it('should return API info', async () => {
      const res = await request(app).get('/api/v1/');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.endpoints).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return validation error for missing fields', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return validation error for invalid email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return validation error for short password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'short',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return validation error for missing fields', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return error for invalid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/v1/unknown-route');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
