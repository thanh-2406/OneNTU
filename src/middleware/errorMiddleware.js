const { HTTP_STATUS } = require('../config/constants');
const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  // Log the error for your own debugging
  console.error('🔥 Global Error Caught:', err.stack);

  // Determine the status code (default to 500 Internal Server Error)
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  
  // Don't leak raw database errors to the frontend in production
  const message = err.message || 'An unexpected internal server error occurred.';

  const errors = process.env.NODE_ENV === 'development' ? { stack: err.stack } : null;
  return sendError(res, message, statusCode, errors);
};

module.exports = { errorHandler };