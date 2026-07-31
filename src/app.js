// src/app.js
const express = require('express');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const cors = require('cors');
const messages = require('./utils/messages');
const path = require("path")
const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss-clean');
const logger = require('./utils/logger');
const compression = require('compression');

// Load environment variables
dotenv.config();

// Create express app
const app = express();
app.set('trust proxy', 1);
app.use(compression());
const { globalLimiter } = require('./middlewares/rateLimiter');
const { sequelize } = require('./config/database');
const { redisClient } = require('./config/redis');

// Security Hardening
app.use(helmet()); 
app.use(xss());    
app.use(hpp());    

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || req.user?._id
  });
  next();
});

// Phase H: Health & Readiness Probes
app.get('/health/live', (req, res) => {
  res.status(200).json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/ready', async (req, res) => {
  let dbReady = false;
  let redisReady = false;

  try {
    await sequelize.authenticate();
    dbReady = true;
  } catch (e) {}

  try {
    redisReady = redisClient.isReady;
  } catch (e) {}

  if (!dbReady) {
    return res.status(503).json({
      status: 'unready',
      database: 'down',
      redis: redisReady ? 'up' : 'down'
    });
  }

  return res.status(200).json({
    status: 'ready',
    database: 'up',
    redis: redisReady ? 'up' : 'degraded'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'up', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const WebhookRoutes = require('./routes/webhook.route'); 

// Middleware for parsing JSON and handling CORS
app.use(globalLimiter); 
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '512kb' }));

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
  : (process.env.NODE_ENV === 'production' 
      ? ['https://gurujewellers.in', 'https://admin.gurujewellers.in'] 
      : '*');

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    credentials: true
  })
);

// Import versioned routes
const v1Routes = require('./routes'); 
const { errorConverter, errorHandler } = require('./middlewares/error.middleware');

// Use the versioned routes
app.use('/api/v1', v1Routes); 
app.use('/api/v1/webhook', WebhookRoutes);

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API Documentation',
      version: '1.0.0',
      description: 'API for managing an e-commerce platform with products, categories, orders, etc.',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
            description: "local server"
      },
        {
    url: "https://api.gurujewellers.in/api/v1",
    description: "Live production server"
  }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ BearerAuth: [] }], // Apply BearerAuth globally
  },
 apis: [path.join(__dirname, "routes/**/*.js")],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 404 handler for routes not found
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Error converter, then error handler
app.use(errorConverter);
app.use(errorHandler);

// Connect to MongoDB and Redis
connectDB();
connectRedis()
  .then(() => {

  })
  .catch(err => {

  });

module.exports = app; // Export the app
