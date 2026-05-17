const { z } = require('zod');
const { VALIDATION } = require('../config/constants');

const createDepartmentSchema = z.object({
  body: z.object({
    department_name: z.string().min(VALIDATION.DEPARTMENT_NAME.MIN, "Name is too short").max(VALIDATION.DEPARTMENT_NAME.MAX),
    department_code: z.string().min(VALIDATION.DEPARTMENT_CODE.MIN).max(VALIDATION.DEPARTMENT_CODE.MAX)
  })
});

const updateDepartmentSchema = z.object({
  body: z.object({
    department_name: z.string().min(VALIDATION.DEPARTMENT_NAME.MIN).max(VALIDATION.DEPARTMENT_NAME.MAX).optional(),
    department_code: z.string().min(VALIDATION.DEPARTMENT_CODE.MIN).max(VALIDATION.DEPARTMENT_CODE.MAX).optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(VALIDATION.NUMERIC_ID_REGEX, "ID must be a number")
  })
});

module.exports = { createDepartmentSchema, updateDepartmentSchema };