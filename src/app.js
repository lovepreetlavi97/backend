// src/app.js
const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const cors = require('cors');
// Load environment variables
dotenv.config();

const app = express();

// Middleware for parsing JSON
app.use(express.json());
app.use(cors());
// Import versioned routes
const v1Routes = require('./routes'); // Import the index.js in routes
//////
// Use the versioned routes
app.use('/api/v1', v1Routes); // Mounting the routes under /api/v1

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API for managing various entities, including subcategories.',
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

// Connect to MongoDB
connectDB();

module.exports = app; // Export the app
