const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');

// Import the welcome route
const welcomeRoute = require('./routes/welcome.route.js'); 

// Load environment variables
dotenv.config();

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Swagger docs route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Connect to MongoDB
connectDB();

// Use the welcome route
app.use('/', welcomeRoute); // Use the welcome route

module.exports = app; // Export the app
