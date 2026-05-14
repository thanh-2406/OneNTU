const { z } = require('zod');

const createDepartmentSchema = z.object({
  body: z.object({
    department_name: z.string().min(2, "Name is too short").max(150),
    department_code: z.string().min(2).max(20)
  })
});

const updateDepartmentSchema = z.object({
  body: z.object({
    department_name: z.string().min(2).max(150).optional(),
    department_code: z.string().min(2).max(20).optional(),
    is_active: z.boolean().optional()
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number")
  })
});

module.exports = { createDepartmentSchema, updateDepartmentSchema };