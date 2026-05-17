const authService = require('../services/authService');
const { HTTP_STATUS, MESSAGES, ROLES, STATUS } = require('../config/constants');

const login = async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ status: STATUS.ERROR, message: MESSAGES.REQUIRED_AUTH_FIELDS });
  }

  if (!ROLES.ALL.includes(role)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ status: STATUS.ERROR, message: MESSAGES.INVALID_ROLE });
  }

  try {
    const authPayload = await authService.login({
      email,
      password,
      role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(HTTP_STATUS.OK).json({ status: STATUS.SUCCESS, data: authPayload });
  } catch (error) {
    next(error);
  }
};

module.exports = { login };