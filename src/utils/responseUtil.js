// responseUtil.js
const successResponse = (res, status, message, data = {}) => {
  return res.status(status).json({
    success: true,
    status,
    message,
    data,
  });
};

const errorResponse = (res, status, message, error = {}) => {
  return res.status(status).json({
    success: false,
    status,
    message,
    error,
  });
};

module.exports = { successResponse, errorResponse };
