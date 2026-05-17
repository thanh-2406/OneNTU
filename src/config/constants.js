const constants = {
  httpStatus: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },

  roles: {
    STUDENT: 'student',
    STAFF: 'staff',
    ADMIN: 'admin',
    ALL: ['student', 'staff', 'admin'],
  },

  jwt: {
    ACCESS_TOKEN_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
  },

  pagination: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  validation: {
    DEPARTMENT_NAME: { MIN: 2, MAX: 150 },
    DEPARTMENT_CODE: { MIN: 2, MAX: 20 },
    NUMERIC_ID_REGEX: /^\d+$/,
  },

  status: {
    SUCCESS: 'success',
    ERROR: 'error',
  },

  messages: {
    SERVER_RUNNING: 'Dashboard API is running smoothly.',
    ROUTE_NOT_FOUND: (route) => `Route ${route} not found.`,
    MISSING_AUTH_TOKEN: 'Access denied. No token provided.',
    INVALID_TOKEN: 'Invalid or expired token.',
    ROLE_NOT_FOUND: 'User role not found. Please log in again.',
    PERMISSION_DENIED: 'You do not have permission to perform this action.',
    REQUIRED_AUTH_FIELDS: 'Email, password, and role are required.',
    INVALID_ROLE: 'Invalid role specified.',
    INVALID_CREDENTIALS: 'Invalid credentials.',
    INVALID_CREDENTIALS_INACTIVE: 'Invalid credentials or inactive account.',
    REQUIRED_DEPARTMENT_FIELDS: 'Department name and code are required.',
    DEPARTMENT_CONFLICT: 'Department name or code already exists.',
  },

  statusTransition: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },
};

module.exports = constants;
