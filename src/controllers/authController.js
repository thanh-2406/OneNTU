const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

const login = async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return sendError(res, MESSAGES.REQUIRED_AUTH_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const authPayload = await authService.login({
      email,
      password,
      role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return sendSuccess(res, authPayload, 'Login successful', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

module.exports = { login };