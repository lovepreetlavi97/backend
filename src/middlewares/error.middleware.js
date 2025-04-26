const { errorResponse } = require('../utils/responseUtil');

// Custom error class for API errors
class APIError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Error converter - converts regular errors to APIError with appropriate status code
const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof APIError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new APIError(
      statusCode,
      message,
      false,
      err.stack
    );
  }
  next(error);
};

// Error handler - sends consistent error response
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  
  // If in production, don't send stack traces for non-operational errors
  const response = {
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(process.env.NODE_ENV === 'development' && !err.isOperational && { 
      note: 'This is an internal server error, not an operational error.' 
    })
  };

  console.error(`[${new Date().toISOString()}] Error:`, {
    url: req.originalUrl,
    method: req.method,
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack
  });

  res.status(statusCode).json(response);
};

module.exports = {
  APIError,
  errorConverter,
  errorHandler
};
