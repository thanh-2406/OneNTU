const { ZodError } = require('zod');
const { HTTP_STATUS } = require('../config/constants');
const { sendValidationError } = require('../utils/response');

// Accepts a Zod schema and validates the request body, query, or params
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Parse the incoming request against the schema asynchronously
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next(); // Data is perfectly valid, proceed
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod's detailed errors into a clean array
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return sendValidationError(res, formattedErrors, 'Invalid request data', HTTP_STATUS.BAD_REQUEST);
      }
      
      // Pass any unexpected non-Zod errors to the global error handler
      next(error); 
    }
  };
};

module.exports = { validateRequest };