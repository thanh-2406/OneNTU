const constants = {
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },

  ROLES: {
    STUDENT: 'student',
    STAFF: 'staff',
    ADMIN: 'admin',
    ALL: ['student', 'staff', 'admin'],
  },

  JWT: {
    ACCESS_TOKEN_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
  },

  SECURITY: {
    BCRYPT_SALT_ROUNDS: 12,
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  REQUEST_STATUSES: [
    { name: 'New', code: 'NEW', description: 'Newly created request', display_order: 1, is_active: true },
    { name: 'Pending', code: 'PENDING', description: 'Waiting for review', display_order: 2, is_active: true },
    { name: 'Approved', code: 'APPROVED', description: 'Approved and awaiting processing', display_order: 3, is_active: true },
    { name: 'In Progress', code: 'IN_PROGRESS', description: 'Work in progress', display_order: 4, is_active: true },
    { name: 'On Hold', code: 'ON_HOLD', description: 'Temporarily paused', display_order: 5, is_active: true },
    { name: 'Completed', code: 'COMPLETED', description: 'Work completed', display_order: 6, is_active: true },
    { name: 'Cancelled', code: 'CANCELLED', description: 'Request cancelled', display_order: 7, is_active: true },
  ],

  DOCUMENT_TYPES: [
    { name: 'Identification', code: 'ID', description: 'Identity documents (ID cards, passports)', is_active: true },
    { name: 'Transcript', code: 'TRANSCRIPT', description: 'Academic transcripts', is_active: true },
    { name: 'Certificate', code: 'CERT', description: 'Certificates and diplomas', is_active: true },
    { name: 'Application', code: 'APP', description: 'Application forms and submissions', is_active: true },
    { name: 'Report', code: 'REPORT', description: 'Internal or external reports', is_active: true },
  ],

  SCHOOL_SEEDS: [
    { name: 'College of Science', code: 'COS', description: 'Science and technology programs', is_active: true },
    { name: 'College of Arts', code: 'COA', description: 'Humanities and arts programs', is_active: true },
    { name: 'College of Business', code: 'COB', description: 'Business administration and economics', is_active: true },
    { name: 'College of Engineering', code: 'COE', description: 'Engineering and applied sciences', is_active: true },
    { name: 'College of Education', code: 'COED', description: 'Teacher training and education studies', is_active: true },
  ],

  VALIDATION: {
    DEPARTMENT_NAME: { MIN: 2, MAX: 150 },
    DEPARTMENT_CODE: { MIN: 2, MAX: 20 },
    SCHOOL_NAME: { MIN: 2, MAX: 150 },
    SCHOOL_CODE: { MIN: 2, MAX: 20 },
    NUMERIC_ID_REGEX: /^\d+$/,
  },

  STATUS: {
    SUCCESS: 'success',
    ERROR: 'error',
  },

  MESSAGES: {
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
    REQUIRED_SCHOOL_FIELDS: 'School name and code are required.',
    SCHOOL_CONFLICT: 'School name or code already exists.',
  },

  STATUS_TRANSITION: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },
};

module.exports = constants;
