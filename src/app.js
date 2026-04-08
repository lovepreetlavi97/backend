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
app.use(compression());
const { globalLimiter } = require('./middlewares/rateLimiter');

// Security Hardening
app.use(helmet()); 
app.use(xss());    
app.use(hpp());    

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id
  });
  next();
});

// Health check endpoint (for load balancers & monitoring)
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
app.use(express.json({ limit: '10kb' })); // Limit body size to 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(
  cors({
    origin: process.env.WEB_BASE_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
    console.log('Redis connection initialized');
  })
  .catch(err => {
    console.warn('Redis connection failed, but application will continue:', err.message);
  });

module.exports = app; // Export the app
