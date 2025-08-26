const logger = require('./utils/logger');

// Centralized error handler middleware
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  logger.error(err.stack);
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
