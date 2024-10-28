const httpStatus = require("http-status");

/**
 * @description - Sends a JSON response with the provided status code and message
 */
const sendResponse = (res, statusCode, message, data = null) => {
  const response = { statusCode, message };
  if (data) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * @description - Sends a success response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} data - Optional data to send with the response
 */
const sendSuccessResponse = (res, message = "Success", data = null) => {
  return sendResponse(res, httpStatus.OK, message, data);
};

/**
 * @description - Sends an authentication failure response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message, default is "Unauthorized Access"
 */
const sendAuthFailureResponse = (res, message = "Unauthorized Access") => {
  return sendResponse(res, httpStatus.UNAUTHORIZED, message);
};

/**
 * @description - Sends a not found response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message, default is "Resource Not Found"
 */
const sendNotFoundResponse = (res, message = "Resource Not Found") => {
  return sendResponse(res, httpStatus.NOT_FOUND, message);
};

/**
 * @description - Sends a forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message, default is "Access Denied"
 */
const sendForbiddenResponse = (res, message = "Access Denied") => {
  return sendResponse(res, httpStatus.FORBIDDEN, message);
};

/**
 * @description - Sends a bad request response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message, default is "Invalid Request"
 * @param {Object} data - Optional data to send with the response
 */
const sendBadRequestResponse = (res, message = "Invalid Request", data = null) => {
  return sendResponse(res, httpStatus.BAD_REQUEST, message, data);
};

/**
 * @description - Sends an internal error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message, default is "Oops! Something went wrong"
 */
const sendInternalErrorResponse = (res, message = "Oops! Something went wrong") => {
  return sendResponse(res, httpStatus.INTERNAL_SERVER_ERROR, message);
};

/**
 * @description - Sends a validation failure response with an array of errors
 * @param {Object} res - Express response object
 * @param {string} message - Custom message, default is "Validation Error"
 * @param {Array} errors - Array of validation errors
 */
const sendValidationFailureResponse = (res, message = "Validation Error", errors = []) => {
  const errorMsg = errors.length ? errors[0].msg : message;
  return sendResponse(res, httpStatus.UNPROCESSABLE_ENTITY, errorMsg, { errors });
};

/**
 * @description - Sends a token refresh response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message, default is "Token Refreshed"
 * @param {string} accessToken - New access token
 * @param {string} refreshToken - New refresh token
 */
const sendTokenRefreshResponse = (res, message = "Token Refreshed", accessToken, refreshToken) => {
  return sendResponse(res, httpStatus.OK, message, { accessToken, refreshToken });
};

module.exports = {
  sendSuccessResponse,
  sendAuthFailureResponse,
  sendNotFoundResponse,
  sendForbiddenResponse,
  sendBadRequestResponse,
  sendInternalErrorResponse,
  sendValidationFailureResponse,
  sendTokenRefreshResponse,
};
