const errorHandler = (err, req, res, next) => {
  // Log the error for your own debugging
  console.error('🔥 Global Error Caught:', err.stack);

  // Determine the status code (default to 500 Internal Server Error)
  const statusCode = err.statusCode || 500;
  
  // Don't leak raw database errors to the frontend in production
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    status: 'error',
    message: message,
    // Only send the stack trace if we are in development mode
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };