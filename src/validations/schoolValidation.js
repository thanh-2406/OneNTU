const { z } = require('zod');
const { VALIDATION } = require('../config/constants');

const createSchoolSchema = z.object({
  body: z.object({
    name: z.string().min(VALIDATION.SCHOOL_NAME.MIN, 'Name is too short').max(VALIDATION.SCHOOL_NAME.MAX),
    code: z.string().min(VALIDATION.SCHOOL_CODE.MIN, 'Code is too short').max(VALIDATION.SCHOOL_CODE.MAX),
    is_active: z.boolean().optional(),
  })
});

const updateSchoolSchema = z.object({
  body: z.object({
    name: z.string().min(VALIDATION.SCHOOL_NAME.MIN, 'Name is too short').max(VALIDATION.SCHOOL_NAME.MAX).optional(),
    code: z.string().min(VALIDATION.SCHOOL_CODE.MIN, 'Code is too short').max(VALIDATION.SCHOOL_CODE.MAX).optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(VALIDATION.NUMERIC_ID_REGEX, 'ID must be a number')
  })
});

module.exports = { createSchoolSchema, updateSchoolSchema };