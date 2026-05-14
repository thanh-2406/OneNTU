const jwt = require('jsonwebtoken');

// Check if the user has a valid JWT access token
const authenticateToken = (req, res, next) => {
  // Tokens are usually sent in the header as: "Bearer eyJhbGci..."
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Access denied. No token provided.' 
    });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Invalid or expired token.' 
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
      return res.status(401).json({ 
        status: 'error', 
        message: 'User role not found. Please log in again.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You do not have permission to perform this action.' 
      });
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };