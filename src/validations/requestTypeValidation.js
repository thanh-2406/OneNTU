const { z } = require('zod');
const { VALIDATION } = require('../config/constants');

const createRequestTypeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is too short').max(150),
    code: z.string().min(1, 'Code is required').max(50),
    description: z.string().max(500).optional(),
  }),
});

const updateRequestTypeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is too short').max(150).optional(),
    code: z.string().min(1, 'Code is required').max(50).optional(),
    description: z.string().max(500).optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(VALIDATION.NUMERIC_ID_REGEX, 'ID must be a number'),
  }),
});

module.exports = { createRequestTypeSchema, updateRequestTypeSchema };