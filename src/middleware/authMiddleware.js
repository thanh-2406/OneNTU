const jwt = require('jsonwebtoken');
const { HTTP_STATUS, MESSAGES, STATUS } = require('../config/constants');
const { sendError } = require('../utils/response');

// Check if the user has a valid JWT access token
const authenticateToken = (req, res, next) => {
  // Tokens are usually sent in the header as: "Bearer eyJhbGci..."
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, MESSAGES.MISSING_AUTH_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return sendError(res, MESSAGES.INVALID_TOKEN, HTTP_STATUS.FORBIDDEN);
    }
    
    // Attach the decoded token payload (id, role) to the request object
    req.user = decoded; 
    next(); // Pass control to the next middleware or controller
  });
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