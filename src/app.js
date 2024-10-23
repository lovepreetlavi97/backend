// src/app.js
const express = require('express');
const connectDB = require('./config/db'); // Ensure this file exists and is correct
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
        url: 'http://localhost:5000/',
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // Export the app
