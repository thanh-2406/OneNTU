const bcrypt = require('bcrypt');
const db = require('../config/db');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/jwt');
const { roles, messages, httpStatus } = require('../config/constants');

const ROLE_CONFIG = {
  [roles.STUDENT]: { tableName: 'students', idColumn: 'student_id', nameColumn: 'full_name' },
  [roles.STAFF]: { tableName: 'staff', idColumn: 'staff_id', nameColumn: 'full_name' },
  [roles.ADMIN]: { tableName: 'admins', idColumn: 'admin_id', nameColumn: 'full_name' },
};

const validateRole = (role) => {
  if (!ROLE_CONFIG[role]) {
    const error = new Error(messages.INVALID_ROLE);
    error.statusCode = httpStatus.BAD_REQUEST;
    throw error;
  }
};

const login = async ({ email, password, role, ipAddress, userAgent }) => {
  validateRole(role);

  const normalizedEmail = email.toLowerCase();
  const { tableName, idColumn, nameColumn } = ROLE_CONFIG[role];

  const userQuery = `SELECT * FROM ${tableName} WHERE email = $1 AND is_active = true`;
  const userResult = await db.query(userQuery, [normalizedEmail]);

  if (userResult.rows.length === 0) {
    const error = new Error(messages.INVALID_CREDENTIALS_INACTIVE);
    error.statusCode = httpStatus.UNAUTHORIZED;
    throw error;
  }

  const user = userResult.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    const error = new Error(messages.INVALID_CREDENTIALS);
    error.statusCode = httpStatus.UNAUTHORIZED;
    throw error;
  }

  const tokenPayload = { id: user[idColumn] };
  const accessToken = generateAccessToken(tokenPayload, role);
  const refreshToken = generateRefreshToken(tokenPayload, role);
  const hashedRefreshToken = hashToken(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const sessionQuery = `
    INSERT INTO sessions (actor_type, actor_id, token_hash, ip_address, user_agent, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  await db.query(sessionQuery, [
    role,
    user[idColumn],
    hashedRefreshToken,
    ipAddress,
    userAgent,
    expiresAt,
  ]);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user[idColumn],
      email: user.email,
      role,
      name: user[nameColumn] || user.full_name,
    },
  };
};

module.exports = {
  login,
};
