const sendSuccess = (res, data = null, message = 'Request successful', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    errors: null,
  });
};

const sendError = (res, message = 'An unexpected error occurred.', statusCode = 500, errors = null) => {
  const payload = {
    status: 'error',
    message,
    data: null,
    errors: errors || null,
  };

  return res.status(statusCode).json(payload);
};

const sendValidationError = (res, errors, message = 'Invalid request data', statusCode = 400) => {
  return sendError(res, message, statusCode, errors);
};

const sendPaginatedResponse = (res, data, meta, message = 'Request successful', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    meta,
    errors: null,
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginatedResponse,
};
