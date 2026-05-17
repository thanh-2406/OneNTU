const authService = require('../services/authService');
const { httpStatus, messages, roles, status } = require('../config/constants');

const login = async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(httpStatus.BAD_REQUEST).json({ status: status.ERROR, message: messages.REQUIRED_AUTH_FIELDS });
  }

  if (!roles.ALL.includes(role)) {
    return res.status(httpStatus.BAD_REQUEST).json({ status: status.ERROR, message: messages.INVALID_ROLE });
  }

  try {
    const authPayload = await authService.login({
      email,
      password,
      role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(httpStatus.OK).json({ status: status.SUCCESS, data: authPayload });
  } catch (error) {
    next(error);
  }
};

module.exports = { login };