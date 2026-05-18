const { z } = require('zod');
const { VALIDATION } = require('../config/constants');

const createProgrammeSchema = z.object({
  body: z.object({
    name: z.string().min(VALIDATION.PROGRAMME_NAME.MIN, 'Name is too short').max(VALIDATION.PROGRAMME_NAME.MAX),
    code: z.string().min(VALIDATION.PROGRAMME_CODE.MIN, 'Code is too short').max(VALIDATION.PROGRAMME_CODE.MAX),
    school_id: z.string().regex(VALIDATION.NUMERIC_ID_REGEX, 'school_id must be a number'),
    is_active: z.boolean().optional(),
  })
});

const updateProgrammeSchema = z.object({
  body: z.object({
    name: z.string().min(VALIDATION.PROGRAMME_NAME.MIN, 'Name is too short').max(VALIDATION.PROGRAMME_NAME.MAX).optional(),
    code: z.string().min(VALIDATION.PROGRAMME_CODE.MIN, 'Code is too short').max(VALIDATION.PROGRAMME_CODE.MAX).optional(),
    school_id: z.string().regex(VALIDATION.NUMERIC_ID_REGEX, 'school_id must be a number').optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(VALIDATION.NUMERIC_ID_REGEX, 'ID must be a number'),
  })
});

const getProgrammesSchema = z.object({
  query: z.object({
    school_id: z.string().regex(VALIDATION.NUMERIC_ID_REGEX, 'school_id must be a number').optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    order: z.string().optional(),
  })
});

module.exports = { createProgrammeSchema, updateProgrammeSchema, getProgrammesSchema };