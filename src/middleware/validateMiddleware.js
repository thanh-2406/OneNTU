const { ZodError } = require('zod');

// Accepts a Zod schema and validates the request body, query, or params
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Parse the incoming request against the schema
      schema.parse({
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

        return res.status(400).json({
          status: 'error',
          message: 'Invalid request data',
          errors: formattedErrors,
        });
      }
      
      // Pass any unexpected non-Zod errors to the global error handler
      next(error); 
    }
  };
};

module.exports = { validateRequest };