const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const { config, logger } = require('./config');
const routes = require('./routes');
const { error, rateLimiter } = require('./middlewares');

const app = express();

// ===========================================
// SECURITY MIDDLEWARE
// ===========================================

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Enable CORS
app.use(cors({
  origin: config.cors.origin === '*' 
    ? '*' 
    : config.cors.origin.split(',').map(o => o.trim()),
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Prevent http param pollution
app.use(hpp());

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// ===========================================
// GENERAL MIDDLEWARE
// ===========================================

// Parse JSON bodies (limit payload size)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies
app.use(cookieParser(config.cookie.secret));

// Compress responses
app.use(compression());

// ===========================================
// LOGGING
// ===========================================

// HTTP request logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }));
}

// ===========================================
// RATE LIMITING
// ===========================================

// Apply general rate limiting to all requests
if (config.env === 'production') {
  app.use('/api', rateLimiter.generalLimiter);
}

// ===========================================
// STATIC FILES
// ===========================================

// Serve uploaded files
app.use('/uploads', express.static(config.upload.uploadDir));

// ===========================================
// API ROUTES
// ===========================================

// API version prefix
app.use(`/api/${config.apiVersion}`, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Express Production Backend API',
    version: '1.0.0',
    documentation: `/api/${config.apiVersion}`,
    health: `/api/${config.apiVersion}/health`,
  });
});

// ===========================================
// ERROR HANDLING
// ===========================================

// Handle 404 - Route not found
app.use(error.notFound);

// Convert errors to ApiError
app.use(error.errorConverter);

// Handle all errors
app.use(error.errorHandler);

module.exports = app;
