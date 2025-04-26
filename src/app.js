// src/app.js
const express = require('express');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const cors = require('cors');
const messages = require('./utils/messages');

// Load environment variables
dotenv.config();

// Create express app
const app = express();

// Middleware for parsing JSON and handling CORS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Import versioned routes
const v1Routes = require('./routes'); // Import the index.js in routes

// Import error handling middleware
const { errorConverter, errorHandler } = require('./middlewares/error.middleware');

// Use the versioned routes
app.use('/api/v1', v1Routes); // Mounting the routes under /api/v1

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
      },
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
  apis: ['./src/routes/**/*.js'], // Adjust path to match your routes
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
