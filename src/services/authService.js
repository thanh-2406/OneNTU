const db = require('../config/db');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/jwt');
const { comparePassword } = require('../utils/password');
const { HTTP_STATUS, MESSAGES, ROLES, JWT } = require('../config/constants');

const ROLE_CONFIG = {
  [ROLES.STUDENT]: { tableName: 'students', idColumn: 'student_id', nameColumn: 'full_name' },
  [ROLES.STAFF]: { tableName: 'staff', idColumn: 'staff_id', nameColumn: 'full_name' },
  [ROLES.ADMIN]: { tableName: 'admins', idColumn: 'admin_id', nameColumn: 'full_name' },
};

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

const validateRole = (role) => {
  if (!ROLE_CONFIG[role]) {
    throw createHttpError(MESSAGES.INVALID_ROLE, HTTP_STATUS.BAD_REQUEST);
  }
};

const getUserByEmail = async (email, role) => {
  validateRole(role);

  const { tableName } = ROLE_CONFIG[role];
  const normalizedEmail = normalizeEmail(email);
  const query = `SELECT * FROM ${tableName} WHERE email = $1 AND is_active = true`;
  const { rows } = await db.query(query, [normalizedEmail]);

  return rows[0] || null;
};

const getUserById = async (id, role) => {
  validateRole(role);

  const { tableName, idColumn } = ROLE_CONFIG[role];
  const query = `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`;
  const { rows } = await db.query(query, [id]);

  return rows[0] || null;
};

const verifyPassword = async (password, passwordHash) => {
  const isValid = await comparePassword(password, passwordHash);
  if (!isValid) {
    throw createHttpError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }
};

const createSession = async ({ role, userId, tokenHash, ipAddress, userAgent, expiresAt }) => {
  const query = `
    INSERT INTO sessions (actor_type, actor_id, token_hash, ip_address, user_agent, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING session_id
  `;

  const { rows } = await db.query(query, [role, userId, tokenHash, ipAddress, userAgent, expiresAt]);
  return rows[0].session_id;
};

const buildAuthResponse = (user, role, accessToken, refreshToken) => {
  const { idColumn, nameColumn } = ROLE_CONFIG[role];

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

const forceLogoutAll = async (actorType, actorId) => {
  if (!['student', 'staff'].includes(actorType)) {
    throw createHttpError('Invalid actor type', HTTP_STATUS.BAD_REQUEST);
  }

  if (!actorId || actorId <= 0) {
    throw createHttpError('Invalid actor ID', HTTP_STATUS.BAD_REQUEST);
  }

  const query = `
    UPDATE sessions 
    SET revoked_at = NOW()
    WHERE actor_type = $1 AND actor_id = $2 AND revoked_at IS NULL
  `;

  const result = await db.query(query, [actorType, actorId]);
  return { revokedCount: result.rowCount };
};

const login = async ({ email, password, role, ipAddress, userAgent }) => {
  if (!email || !password || !role) {
    throw createHttpError(MESSAGES.REQUIRED_AUTH_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }

  const user = await getUserByEmail(email, role);

  if (!user) {
    throw createHttpError(MESSAGES.INVALID_CREDENTIALS_INACTIVE, HTTP_STATUS.UNAUTHORIZED);
  }

  await verifyPassword(password, user.password_hash);

  const refreshTokenHash = hashToken(generateRefreshToken({ id: user[ROLE_CONFIG[role].idColumn] }, role));

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const sessionId = await createSession({
    role,
    userId: user[ROLE_CONFIG[role].idColumn],
    tokenHash: refreshTokenHash,
    ipAddress,
    userAgent,
    expiresAt,
  });

  const authPayload = { 
    id: user[ROLE_CONFIG[role].idColumn], 
    passwordResetAt: user.password_reset_at,
    sessionId: sessionId
  };
  const accessToken = generateAccessToken(authPayload, role);
  const refreshToken = generateRefreshToken(authPayload, role);

  return buildAuthResponse(user, role, accessToken, refreshToken);
};

module.exports = {
  login,
  getUserByEmail,
  getUserById,
  verifyPassword,
  createSession,
  forceLogoutAll,
};
