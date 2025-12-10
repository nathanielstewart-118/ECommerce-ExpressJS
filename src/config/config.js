const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    API_VERSION: Joi.string().default('v1'),

    // MongoDB
    MONGODB_URI: Joi.string().required().description('MongoDB connection string'),

    // Redis
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').default(''),
    REDIS_DB: Joi.number().default(0),

    // JWT
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number().default(10),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number().default(60),

    // Cookie
    COOKIE_SECRET: Joi.string().required(),

    // SMTP
    SMTP_HOST: Joi.string().description('SMTP server host'),
    SMTP_PORT: Joi.number().description('SMTP server port'),
    SMTP_USERNAME: Joi.string().description('SMTP username'),
    SMTP_PASSWORD: Joi.string().description('SMTP password'),
    EMAIL_FROM: Joi.string().description('Email sender address'),
    EMAIL_FROM_NAME: Joi.string().default('YourApp'),

    // Stripe
    STRIPE_SECRET_KEY: Joi.string().allow(''),
    STRIPE_WEBHOOK_SECRET: Joi.string().allow(''),
    STRIPE_PUBLISHABLE_KEY: Joi.string().allow(''),

    // OpenAI
    OPENAI_API_KEY: Joi.string().allow(''),
    OPENAI_MODEL: Joi.string().default('gpt-4'),

    // Twilio
    TWILIO_ACCOUNT_SID: Joi.string().allow(''),
    TWILIO_AUTH_TOKEN: Joi.string().allow(''),
    TWILIO_PHONE_NUMBER: Joi.string().allow(''),

    // AWS S3
    AWS_ACCESS_KEY_ID: Joi.string().allow(''),
    AWS_SECRET_ACCESS_KEY: Joi.string().allow(''),
    AWS_REGION: Joi.string().default('us-east-1'),
    AWS_S3_BUCKET: Joi.string().allow(''),

    // Google OAuth
    GOOGLE_CLIENT_ID: Joi.string().allow(''),
    GOOGLE_CLIENT_SECRET: Joi.string().allow(''),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

    // Logging
    LOG_LEVEL: Joi.string().default('debug'),
    LOG_FORMAT: Joi.string().default('combined'),

    // CORS
    CORS_ORIGIN: Joi.string().default('*'),
    CORS_CREDENTIALS: Joi.boolean().default(true),

    // File Upload
    MAX_FILE_SIZE: Joi.number().default(10485760),
    UPLOAD_DIR: Joi.string().default('uploads'),

    // Cron
    CRON_ENABLED: Joi.boolean().default(true),
    CRON_CLEANUP_SCHEDULE: Joi.string().default('0 0 * * *'),
    CRON_REPORT_SCHEDULE: Joi.string().default('0 9 * * 1'),
    CRON_SYNC_SCHEDULE: Joi.string().default('*/15 * * * *'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  apiVersion: envVars.API_VERSION,

  mongoose: {
    url: envVars.MONGODB_URI + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    db: envVars.REDIS_DB,
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },

  cookie: {
    secret: envVars.COOKIE_SECRET,
  },

  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
    fromName: envVars.EMAIL_FROM_NAME,
  },

  stripe: {
    secretKey: envVars.STRIPE_SECRET_KEY,
    webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
    publishableKey: envVars.STRIPE_PUBLISHABLE_KEY,
  },

  openai: {
    apiKey: envVars.OPENAI_API_KEY,
    model: envVars.OPENAI_MODEL,
  },

  twilio: {
    accountSid: envVars.TWILIO_ACCOUNT_SID,
    authToken: envVars.TWILIO_AUTH_TOKEN,
    phoneNumber: envVars.TWILIO_PHONE_NUMBER,
  },

  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION,
    s3Bucket: envVars.AWS_S3_BUCKET,
  },

  google: {
    clientId: envVars.GOOGLE_CLIENT_ID,
    clientSecret: envVars.GOOGLE_CLIENT_SECRET,
  },

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
  },

  logging: {
    level: envVars.LOG_LEVEL,
    format: envVars.LOG_FORMAT,
  },

  cors: {
    origin: envVars.CORS_ORIGIN,
    credentials: envVars.CORS_CREDENTIALS,
  },

  upload: {
    maxFileSize: envVars.MAX_FILE_SIZE,
    uploadDir: envVars.UPLOAD_DIR,
  },

  cron: {
    enabled: envVars.CRON_ENABLED,
    cleanupSchedule: envVars.CRON_CLEANUP_SCHEDULE,
    reportSchedule: envVars.CRON_REPORT_SCHEDULE,
    syncSchedule: envVars.CRON_SYNC_SCHEDULE,
  },
};
