// src/app.js
const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

// Load environment variables
dotenv.config();

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Import versioned routes
const v1Routes = require('./routes'); // Import the index.js in routes

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
        url: 'http://localhost:3000/api/v1',
      },
    ],
  },
  apis: ['./src/routes/**/*.js'], // Adjusted to point to your route files
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
console.log(swaggerDocs); // Log the generated Swagger docs to the console
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Connect to MongoDB
connectDB();

// No need to start the server here
module.exports = app; // Export the app
