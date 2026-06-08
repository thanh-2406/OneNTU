const { z } = require('zod');
const { VALIDATION } = require('../config/constants');
const { getDepartmentById } = require('../services/departmentService');

// Central matric number pattern for this project (allow letters, numbers, dashes and slashes)
// Adjust the pattern here if your institution has a stricter format.
const MATRIC_NUMBER_REGEX = /^[A-Za-z0-9\-\/]{4,20}$/;

const STAFF_EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'visiting'];

const parsePositiveInt = (val) => {
  if (typeof val === 'string' && val.trim() !== '') return Number(val);
  return val;
};

const parseBoolean = (val) => {
  if (typeof val === 'string') {
    const normalized = val.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return val;
};

const bodySchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(VALIDATION.DEPARTMENT_NAME.MIN, `Full name must be at least ${VALIDATION.DEPARTMENT_NAME.MIN} characters`)
    .max(VALIDATION.DEPARTMENT_NAME.MAX, `Full name must be at most ${VALIDATION.DEPARTMENT_NAME.MAX} characters`),

  matric_number: z
    .string()
    .trim()
    .min(4, 'Matric number is too short')
    .max(20, 'Matric number is too long')
    .regex(MATRIC_NUMBER_REGEX, 'Invalid matric number format. Allowed: letters, numbers, dash(-), slash(/)'),

  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .transform((s) => s.toLowerCase()),

  programme_id: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val);
    return val;
  }, z.number().int().positive().refine((v) => v > 0, { message: 'programme_id must be a positive integer' })),

  year_of_study: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val);
    return val;
  }, z.number().int().min(1, 'year_of_study must be at least 1').max(10, 'year_of_study must be at most 10')),

}).refine((b) => typeof b.password === 'undefined', {
  message: 'Password must not be provided; it is generated server-side',
  path: ['password'],
});

const staffBodySchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(VALIDATION.DEPARTMENT_NAME.MIN, `Full name must be at least ${VALIDATION.DEPARTMENT_NAME.MIN} characters`)
    .max(VALIDATION.DEPARTMENT_NAME.MAX, `Full name must be at most ${VALIDATION.DEPARTMENT_NAME.MAX} characters`),

  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .transform((s) => s.toLowerCase()),

  job_title: z
    .string()
    .trim()
    .min(VALIDATION.DEPARTMENT_NAME.MIN, `Job title must be at least ${VALIDATION.DEPARTMENT_NAME.MIN} characters`)
    .max(VALIDATION.DEPARTMENT_NAME.MAX, `Job title must be at most ${VALIDATION.DEPARTMENT_NAME.MAX} characters`),

  department_id: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val);
    return val;
  },
  z.number().int().positive().refine(async (value) => {
    const department = await getDepartmentById(value);
    return Boolean(department && department.is_active);
  }, {
    message: 'department_id must reference a valid active department',
  })),

  employment_type: z.enum(STAFF_EMPLOYMENT_TYPES, {
    errorMap: () => ({ message: `employment_type must be one of: ${STAFF_EMPLOYMENT_TYPES.join(', ')}` }),
  }),

  specialisation_ids: z
    .array(z.preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') return Number(val);
      return val;
    }, z.number().int().positive()), {
      required_error: 'specialisation_ids must be an array of positive integers',
    })
    .optional(),
}).refine((b) => typeof b.password === 'undefined', {
  message: 'Password must not be provided; it is generated server-side',
  path: ['password'],
});

const createStudentSchema = z.object({
  body: bodySchema,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

const updateStudentBodySchema = z.object({
  matric_number: z
    .string()
    .trim()
    .min(4, 'Matric number is too short')
    .max(20, 'Matric number is too long')
    .regex(MATRIC_NUMBER_REGEX, 'Invalid matric number format. Allowed: letters, numbers, dash(-), slash(/)')
    .optional(),

  programme_id: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val);
    return val;
  }, z.number().int().positive().optional()),

  year_of_study: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val);
    return val;
  }, z.number().int().min(1, 'year_of_study must be at least 1').max(10, 'year_of_study must be at most 10').optional()),

  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .transform((s) => s.toLowerCase())
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided to update',
});

const updateStaffBodySchema = z.object({
  department_id: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val);
    return val;
  }, z.number().int().positive().optional()),

  job_title: z
    .string()
    .trim()
    .min(VALIDATION.DEPARTMENT_NAME.MIN, `Job title must be at least ${VALIDATION.DEPARTMENT_NAME.MIN} characters`)
    .max(VALIDATION.DEPARTMENT_NAME.MAX, `Job title must be at most ${VALIDATION.DEPARTMENT_NAME.MAX} characters`)
    .optional(),

  employment_type: z.enum(STAFF_EMPLOYMENT_TYPES, {
    errorMap: () => ({ message: `employment_type must be one of: ${STAFF_EMPLOYMENT_TYPES.join(', ')}` }),
  }).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided to update',
});

const createStaffSchema = z.object({
  body: staffBodySchema,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

const studentListQuerySchema = z.object({
  programme_id: z.preprocess(parsePositiveInt, z.number().int().positive()).optional(),
  year_of_study: z.preprocess(parsePositiveInt, z.number().int().positive()).optional(),
  is_active: z.preprocess(parseBoolean, z.boolean()).optional(),
  page: z.preprocess(parsePositiveInt, z.number().int().positive()).optional(),
  limit: z.preprocess(parsePositiveInt, z.number().int().positive()).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const studentParamsSchema = z.object({
  id: z.preprocess(parsePositiveInt, z.number().int().positive()),
});

const listStudentsSchema = z.object({
  body: z.object({}).optional(),
  query: studentListQuerySchema.optional(),
  params: z.object({}).optional(),
});

const getStudentSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: studentParamsSchema,
});

const updateStudentSchema = z.object({
  body: updateStudentBodySchema,
  query: z.object({}).optional(),
  params: studentParamsSchema,
});

const staffListQuerySchema = z.object({
  department_id: z.preprocess(parsePositiveInt, z.number().int().positive()).optional(),
  employment_type: z.enum(STAFF_EMPLOYMENT_TYPES).optional(),
  is_active: z.preprocess(parseBoolean, z.boolean()).optional(),
  page: z.preprocess(parsePositiveInt, z.number().int().positive()).optional(),
  limit: z.preprocess(parsePositiveInt, z.number().int().positive()).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const staffParamsSchema = z.object({
  id: z.preprocess(parsePositiveInt, z.number().int().positive()),
});

const listStaffSchema = z.object({
  body: z.object({}).optional(),
  query: staffListQuerySchema.optional(),
  params: z.object({}).optional(),
});

const getStaffSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: staffParamsSchema,
});

const updateStaffSchema = z.object({
  body: updateStaffBodySchema,
  query: z.object({}).optional(),
  params: staffParamsSchema,
});

const forceLogoutAllBodySchema = z.object({
  actor_type: z.enum(['student', 'staff']).describe('Type of user to logout'),
  actor_id: z.preprocess(parsePositiveInt, z.number().int().positive().describe('ID of user to logout')),
});

const forceLogoutAllSchema = z.object({
  body: forceLogoutAllBodySchema,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

module.exports = {
  createStudentSchema,
  createStaffSchema,
  updateStudentSchema,
  updateStaffSchema,
  listStudentsSchema,
  getStudentSchema,
  listStaffSchema,
  getStaffSchema,
  forceLogoutAllSchema,
  MATRIC_NUMBER_REGEX,
};
