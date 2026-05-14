const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate a short-lived access token (e.g., 15 minutes)
const generateAccessToken = (user, role) => {
  return jwt.sign(
    { id: user.id, role: role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate a long-lived refresh token (e.g., 7 days)
const generateRefreshToken = (user, role) => {
  return jwt.sign(
    { id: user.id, role: role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
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