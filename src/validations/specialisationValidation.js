const { z } = require('zod');
const { VALIDATION } = require('../config/constants');

const createSpecialisationSchema = z.object({
  body: z.object({
    specialisation_name: z.string().min(VALIDATION.DEPARTMENT_NAME.MIN, 'Name is too short').max(VALIDATION.DEPARTMENT_NAME.MAX),
    description: z.string().optional(),
  })
});

const updateSpecialisationSchema = z.object({
  body: z.object({
    specialisation_name: z.string().min(VALIDATION.DEPARTMENT_NAME.MIN).max(VALIDATION.DEPARTMENT_NAME.MAX).optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(VALIDATION.NUMERIC_ID_REGEX, 'ID must be a number')
  })
});

module.exports = { createSpecialisationSchema, updateSpecialisationSchema };
