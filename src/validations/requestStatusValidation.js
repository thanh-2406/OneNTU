const { z } = require('zod');
const { VALIDATION } = require('../config/constants');

// Read-only for most users; validation kept for possible admin operations (protected)
const createRequestStatusSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150),
    code: z.string().min(1).max(50),
    description: z.string().max(500).optional(),
    display_order: z.number().int().min(0),
    is_active: z.boolean().optional(),
  })
});

const updateRequestStatusSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150).optional(),
    code: z.string().min(1).max(50).optional(),
    description: z.string().max(500).optional(),
    display_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(VALIDATION.NUMERIC_ID_REGEX, 'ID must be a number')
  })
});

module.exports = { createRequestStatusSchema, updateRequestStatusSchema };