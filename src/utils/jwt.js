const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT } = require('../config/constants');

// Generate a short-lived access token
const generateAccessToken = (user, role) => {
  return jwt.sign(
    { id: user.id, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: JWT.ACCESS_TOKEN_EXPIRES_IN }
  );
};

// Generate a long-lived refresh token
const generateRefreshToken = (user, role) => {
  return jwt.sign(
    { id: user.id, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: JWT.REFRESH_TOKEN_EXPIRES_IN }
  );
};

// Hash the refresh token before saving it to the DB
// If the DB is compromised, the attacker still can't use the raw token
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken
};