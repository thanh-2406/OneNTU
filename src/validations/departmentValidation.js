const { z } = require('zod');
const { validation } = require('../config/constants');

const createDepartmentSchema = z.object({
  body: z.object({
    department_name: z.string().min(validation.DEPARTMENT_NAME.MIN, "Name is too short").max(validation.DEPARTMENT_NAME.MAX),
    department_code: z.string().min(validation.DEPARTMENT_CODE.MIN).max(validation.DEPARTMENT_CODE.MAX),
  })
});

const updateDepartmentSchema = z.object({
  body: z.object({
    department_name: z.string().min(validation.DEPARTMENT_NAME.MIN).max(validation.DEPARTMENT_NAME.MAX).optional(),
    department_code: z.string().min(validation.DEPARTMENT_CODE.MIN).max(validation.DEPARTMENT_CODE.MAX).optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(validation.NUMERIC_ID_REGEX, "ID must be a number")
  })
});

module.exports = { createDepartmentSchema, updateDepartmentSchema };