# Express Production Backend

A production-ready Express.js backend API with MongoDB, JWT authentication, cron jobs, and third-party API integrations.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with access & refresh tokens
  - Role-based access control (RBAC)
  - Email verification & password reset
  - Secure password hashing with bcrypt

- **Database**
  - MongoDB with Mongoose ODM
  - Paginated queries
  - Text search
  - Data validation

- **Security**
  - Helmet.js for HTTP headers
  - Rate limiting
  - CORS configuration
  - Data sanitization (NoSQL injection prevention)
  - XSS protection
  - HTTP Parameter Pollution prevention

- **API Features**
  - RESTful API design
  - Request validation with Joi
  - Error handling middleware
  - Response compression

- **Cron Jobs**
  - Scheduled tasks with node-cron
  - Token cleanup
  - Daily reports
  - Stock monitoring
  - Data synchronization

- **Third-Party Integrations**
  - Stripe (Payments)
  - OpenAI (AI features)
  - Nodemailer (Email)

- **Process Management**
  - PM2 configuration for production
  - Cluster mode support
  - Auto-restart on crash
  - Log management

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- PM2 (for production)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd express-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Create required directories**
   ```bash
   mkdir -p logs uploads
   ```

5. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod --dbpath /data/db
   
   # Or use MongoDB Atlas connection string in .env
   ```

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production with PM2
```bash
# Start
npm run pm2:start

# Or with production environment
pm2 start ecosystem.config.js --env production

# View logs
npm run pm2:logs

# Monitor
npm run pm2:monit

# Restart
npm run pm2:restart

# Stop
npm run pm2:stop
```

## 📁 Project Structure

```
express-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── config.js     # Environment variables
│   │   ├── database.js   # MongoDB connection
│   │   ├── logger.js     # Winston logger
│   │   └── roles.js      # Role permissions
│   │
│   ├── controllers/      # Route controllers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── product.controller.js
│   │
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── validate.middleware.js
│   │   └── rateLimiter.middleware.js
│   │
│   ├── models/           # Mongoose models
│   │   ├── user.model.js
│   │   ├── product.model.js
│   │   ├── category.model.js
│   │   ├── order.model.js
│   │   └── token.model.js
│   │
│   ├── routes/           # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   └── webhook.routes.js
│   │
│   ├── services/         # Business logic
│   │   ├── auth.service.js
│   │   ├── token.service.js
│   │   ├── email.service.js
│   │   ├── user.service.js
│   │   ├── product.service.js
│   │   ├── stripe.service.js
│   │   └── openai.service.js
│   │
│   ├── jobs/             # Cron jobs
│   │   ├── cron.js
│   │   └── cron-runner.js
│   │
│   ├── utils/            # Utility functions
│   │   ├── ApiError.js
│   │   ├── catchAsync.js
│   │   └── helpers.js
│   │
│   ├── validations/      # Request validation schemas
│   │   └── index.js
│   │
│   ├── app.js            # Express app setup
│   └── index.js          # Entry point
│
├── logs/                 # Log files
├── uploads/              # Uploaded files
├── .env.example          # Environment template
├── .gitignore
├── ecosystem.config.js   # PM2 configuration
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/logout` | Logout user |
| POST | `/api/v1/auth/refresh-tokens` | Refresh access token |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password |
| POST | `/api/v1/auth/verify-email` | Verify email address |
| POST | `/api/v1/auth/change-password` | Change password |
| GET | `/api/v1/auth/me` | Get current user |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List all users |
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users/:id` | Get user by ID |
| PATCH | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Delete user |
| GET | `/api/v1/users/stats` | Get user statistics |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List all products |
| POST | `/api/v1/products` | Create product (Admin) |
| GET | `/api/v1/products/:id` | Get product by ID |
| PATCH | `/api/v1/products/:id` | Update product (Admin) |
| DELETE | `/api/v1/products/:id` | Delete product (Admin) |
| GET | `/api/v1/products/search` | Search products |
| GET | `/api/v1/products/featured` | Get featured products |

## ⚙️ Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `OPENAI_API_KEY` - OpenAI API key

## 🔒 Security Best Practices

1. Always use HTTPS in production
2. Keep `.env` file secure and never commit it
3. Use strong JWT secrets (at least 32 characters)
4. Enable rate limiting in production
5. Keep dependencies updated
6. Use environment-specific configurations
7. Implement proper logging and monitoring
8. Regular security audits

## 📊 Cron Jobs

The application includes several scheduled tasks:

| Job | Schedule | Description |
|-----|----------|-------------|
| Token Cleanup | Daily at midnight | Removes expired tokens |
| Daily Report | Daily at 9 AM | Generates sales reports |
| Low Stock Check | Every 15 minutes | Monitors inventory levels |
| Data Sync | Every 15 minutes | Syncs with external services |
| Weekly Analytics | Monday at 9 AM | Generates weekly stats |
| Session Cleanup | Monday at 1 AM | Removes old sessions |
| Archive Orders | Monthly on 1st | Archives old orders |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run coverage
```

## 📝 Linting

```bash
# Run ESLint
npm run lint

# Fix ESLint errors
npm run lint:fix
```

## 🔧 PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js

# Start with specific environment
pm2 start ecosystem.config.js --env production

# Reload with zero-downtime
pm2 reload ecosystem.config.js

# View logs
pm2 logs

# Monitor processes
pm2 monit

# Save process list
pm2 save

# Generate startup script
pm2 startup
```

## 📄 License

MIT License - feel free to use this project for your own applications.