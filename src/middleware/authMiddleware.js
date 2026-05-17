const jwt = require('jsonwebtoken');
const { httpStatus, messages, status } = require('../config/constants');

// Check if the user has a valid JWT access token
const authenticateToken = (req, res, next) => {
  // Tokens are usually sent in the header as: "Bearer eyJhbGci..."
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(httpStatus.UNAUTHORIZED).json({ 
      status: status.ERROR, 
      message: messages.MISSING_AUTH_TOKEN,
    });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(httpStatus.FORBIDDEN).json({ 
        status: status.ERROR, 
        message: messages.INVALID_TOKEN,
      });
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
      return res.status(httpStatus.UNAUTHORIZED).json({ 
        status: status.ERROR, 
        message: messages.ROLE_NOT_FOUND,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(httpStatus.FORBIDDEN).json({ 
        status: status.ERROR, 
        message: messages.PERMISSION_DENIED,
      });
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };