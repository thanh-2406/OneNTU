const jwt = require('jsonwebtoken');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { sendError } = require('../utils/response');
const { getUserById } = require('../services/authService');

// Check if the user has a valid JWT access token
const authenticateToken = async (req, res, next) => {
  // Tokens are usually sent in the header as: "Bearer eyJhbGci..."
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, MESSAGES.MISSING_AUTH_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    return sendError(res, MESSAGES.INVALID_TOKEN, HTTP_STATUS.FORBIDDEN);
  }

  if (!decoded || !decoded.id || !decoded.role) {
    return sendError(res, MESSAGES.INVALID_TOKEN, HTTP_STATUS.FORBIDDEN);
  }

  try {
    const user = await getUserById(decoded.id, decoded.role);
    if (!user || !user.is_active) {
      return sendError(res, MESSAGES.INVALID_TOKEN, HTTP_STATUS.FORBIDDEN);
    }

    req.user = {
      id: user[decoded.role === 'admin' ? 'admin_id' : decoded.role === 'staff' ? 'staff_id' : 'student_id'],
      role: decoded.role,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Error verifying authenticated user', error);
    return sendError(res, MESSAGES.INVALID_TOKEN, HTTP_STATUS.FORBIDDEN);
  }
};

// Check if the authenticated user has the required role
// Usage: requireRole(['admin', 'staff'])
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, MESSAGES.ROLE_NOT_FOUND, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, MESSAGES.PERMISSION_DENIED, HTTP_STATUS.FORBIDDEN);
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };