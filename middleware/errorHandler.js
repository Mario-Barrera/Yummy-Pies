// When an error occurs in any route or middleware, this function catches it.
// Logs the error stack trace using your logger utility
// Sends a JSON response to the client with: The HTTP status code (err.status or default 500 for server errors)
// Or a JSON error message (err.message or a generic 'Internal server error').


const logger = require('../utils/logger');

// Centralized error handler middleware
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  logger.error(err.stack);
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
